-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  actor_id uuid NOT NULL,
  actor_name text NOT NULL,
  actor_handle text NOT NULL,
  post_id uuid,
  comment_id uuid,
  content text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification on like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id uuid;
  liker_name text;
  liker_handle text;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker info from profiles
  SELECT user_name, user_handle INTO liker_name, liker_handle
  FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id)
  VALUES (post_author_id, 'like', NEW.user_id, liker_name, liker_handle, NEW.post_id);
  
  RETURN NEW;
END;
$$;

-- Trigger for likes
CREATE TRIGGER on_like_notify
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_like();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id uuid;
BEGIN
  -- Get post author
  SELECT user_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, post_id, comment_id, content)
  VALUES (post_author_id, 'comment', NEW.user_id, NEW.author_name, NEW.author_handle, NEW.post_id, NEW.id, NEW.content);
  
  RETURN NEW;
END;
$$;

-- Trigger for comments
CREATE TRIGGER on_comment_notify
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name text;
  follower_handle text;
BEGIN
  -- Get follower info from profiles
  SELECT user_name, user_handle INTO follower_name, follower_handle
  FROM profiles WHERE id = NEW.follower_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle)
  VALUES (NEW.following_id, 'follow', NEW.follower_id, follower_name, follower_handle);
  
  RETURN NEW;
END;
$$;

-- Trigger for follows
CREATE TRIGGER on_follow_notify
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_follow();