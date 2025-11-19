-- Create retweets table
CREATE TABLE IF NOT EXISTS public.retweets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  quote_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, original_post_id)
);

-- Enable RLS on retweets
ALTER TABLE public.retweets ENABLE ROW LEVEL SECURITY;

-- RLS policies for retweets
CREATE POLICY "Anyone can view retweets" ON public.retweets
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own retweets" ON public.retweets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retweets" ON public.retweets
  FOR DELETE USING (auth.uid() = user_id);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookmarks
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on hashtags
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- RLS policies for hashtags
CREATE POLICY "Anyone can view hashtags" ON public.hashtags
  FOR SELECT USING (true);

-- Create post_hashtags junction table
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Enable RLS on post_hashtags
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_hashtags
CREATE POLICY "Anyone can view post hashtags" ON public.post_hashtags
  FOR SELECT USING (true);

-- Create mentions table
CREATE TABLE IF NOT EXISTS public.mentions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_handle text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on mentions
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for mentions
CREATE POLICY "Anyone can view mentions" ON public.mentions
  FOR SELECT USING (true);

-- Add columns to posts for quote retweets
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS is_retweet boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS original_post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_original ON public.posts(original_post_id) WHERE original_post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_retweets_original ON public.retweets(original_post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON public.post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON public.post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_mentions_user ON public.mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_post ON public.mentions(post_id);

-- Function to notify on mention
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_name text;
  post_author_handle text;
BEGIN
  -- Get post author info from profiles
  SELECT user_name, user_handle INTO post_author_name, post_author_handle
  FROM profiles WHERE id = (SELECT user_id FROM posts WHERE id = NEW.post_id);
  
  -- Create notification for mentioned user
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id)
  VALUES (NEW.mentioned_user_id, 'mention', 
          (SELECT user_id FROM posts WHERE id = NEW.post_id),
          post_author_name, post_author_handle, NEW.post_id);
  
  RETURN NEW;
END;
$$;

-- Trigger for mention notifications
DROP TRIGGER IF EXISTS on_mention_created ON public.mentions;
CREATE TRIGGER on_mention_created
  AFTER INSERT ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_mention();

-- Function to notify on retweet
CREATE OR REPLACE FUNCTION public.notify_on_retweet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id uuid;
  retweeter_name text;
  retweeter_handle text;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.original_post_id;
  
  -- Don't notify if user retweets their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get retweeter info from profiles
  SELECT user_name, user_handle INTO retweeter_name, retweeter_handle
  FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id, content)
  VALUES (post_author_id, 'retweet', NEW.user_id, retweeter_name, retweeter_handle, NEW.original_post_id, NEW.quote_text);
  
  RETURN NEW;
END;
$$;

-- Trigger for retweet notifications
DROP TRIGGER IF EXISTS on_retweet_created ON public.retweets;
CREATE TRIGGER on_retweet_created
  AFTER INSERT ON public.retweets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_retweet();

-- Fix infinite recursion in conversation_participants policy
-- Drop problematic policy
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Create security definer function to check conversation access
CREATE OR REPLACE FUNCTION public.user_can_access_conversation(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = conversation_uuid
      AND user_id = user_uuid
  );
$$;

-- Recreate policy using the function
CREATE POLICY "Users can view participants in their conversations" 
  ON public.conversation_participants
  FOR SELECT 
  USING (public.user_can_access_conversation(conversation_id, auth.uid()));