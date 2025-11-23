-- Create post_boosts table for tracking promoted posts
CREATE TABLE IF NOT EXISTS public.post_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Enable RLS on post_boosts
ALTER TABLE public.post_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_boosts
CREATE POLICY "Anyone can view boosts"
  ON public.post_boosts FOR SELECT
  USING (true);

CREATE POLICY "Users can boost posts"
  ON public.post_boosts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their boosts"
  ON public.post_boosts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_boosts_post_id ON public.post_boosts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_boosts_user_id ON public.post_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_boosts_created_at ON public.post_boosts(created_at DESC);

-- Create view for post engagement scores
CREATE OR REPLACE VIEW public.post_engagement_view AS
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

-- Create view for trending hashtags
CREATE OR REPLACE VIEW public.trending_hashtags_view AS
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

-- Add notification for boosts
CREATE OR REPLACE FUNCTION public.notify_on_boost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  booster_name TEXT;
  booster_handle TEXT;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user boosts their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get booster info
  SELECT user_name, user_handle INTO booster_name, booster_handle
  FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id)
  VALUES (post_author_id, 'boost', NEW.user_id, booster_name, booster_handle, NEW.post_id);
  
  RETURN NEW;
END;
$$;

-- Create trigger for boost notifications
DROP TRIGGER IF EXISTS on_post_boost ON public.post_boosts;
CREATE TRIGGER on_post_boost
  AFTER INSERT ON public.post_boosts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_boost();

-- Enable realtime for post_boosts
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_boosts;