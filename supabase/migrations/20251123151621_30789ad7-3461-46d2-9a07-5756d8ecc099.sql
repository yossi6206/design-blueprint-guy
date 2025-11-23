-- Fix security definer views by recreating them with SECURITY INVOKER
-- This ensures views run with the caller's privileges, not the creator's

-- Drop existing views
DROP VIEW IF EXISTS public.post_engagement_view CASCADE;
DROP VIEW IF EXISTS public.trending_hashtags_view CASCADE;

-- Recreate post_engagement_view with SECURITY INVOKER
CREATE VIEW public.post_engagement_view
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.created_at,
  p.user_id,
  p.author_name,
  p.author_handle,
  p.content,
  p.image,
  p.is_retweet,
  p.original_post_id,
  COALESCE(likes_count.count, 0) as likes_count,
  COALESCE(comments_count.count, 0) as comments_count,
  COALESCE(retweets_count.count, 0) as retweets_count,
  COALESCE(boosts_count.count, 0) as boosts_count,
  -- Engagement score calculation (weighted)
  (
    COALESCE(likes_count.count, 0) * 1 +
    COALESCE(comments_count.count, 0) * 3 +
    COALESCE(retweets_count.count, 0) * 2 +
    COALESCE(boosts_count.count, 0) * 10 +
    -- Recency bonus: newer posts get higher scores
    CASE 
      WHEN p.created_at > now() - interval '1 hour' THEN 50
      WHEN p.created_at > now() - interval '6 hours' THEN 20
      WHEN p.created_at > now() - interval '24 hours' THEN 10
      ELSE 0
    END
  ) as engagement_score,
  -- Boosted posts get priority
  CASE WHEN EXISTS (
    SELECT 1 FROM public.post_boosts pb 
    WHERE pb.post_id = p.id 
    AND pb.created_at > now() - interval '24 hours'
  ) THEN true ELSE false END as is_boosted
FROM public.posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM public.likes 
  GROUP BY post_id
) likes_count ON p.id = likes_count.post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM public.comments 
  GROUP BY post_id
) comments_count ON p.id = comments_count.post_id
LEFT JOIN (
  SELECT original_post_id, COUNT(*) as count 
  FROM public.retweets 
  GROUP BY original_post_id
) retweets_count ON p.id = retweets_count.original_post_id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count 
  FROM public.post_boosts 
  WHERE created_at > now() - interval '24 hours'
  GROUP BY post_id
) boosts_count ON p.id = boosts_count.post_id;

-- Recreate trending_hashtags_view with SECURITY INVOKER
CREATE VIEW public.trending_hashtags_view
WITH (security_invoker = true)
AS
SELECT 
  h.id,
  h.tag,
  COUNT(ph.post_id) as post_count,
  COUNT(DISTINCT CASE 
    WHEN p.created_at > now() - interval '24 hours' 
    THEN ph.post_id 
  END) as recent_post_count
FROM public.hashtags h
LEFT JOIN public.post_hashtags ph ON h.id = ph.hashtag_id
LEFT JOIN public.posts p ON ph.post_id = p.id
GROUP BY h.id, h.tag
HAVING COUNT(DISTINCT CASE 
  WHEN p.created_at > now() - interval '24 hours' 
  THEN ph.post_id 
END) > 0
ORDER BY recent_post_count DESC, post_count DESC
LIMIT 10;