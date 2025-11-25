-- Create trigger function to handle mention notifications
CREATE OR REPLACE FUNCTION public.handle_mention_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  post_author_name TEXT;
  post_author_handle TEXT;
  post_author_id UUID;
BEGIN
  -- Get post author info
  SELECT user_id, author_name, author_handle 
  INTO post_author_id, post_author_name, post_author_handle
  FROM posts 
  WHERE id = NEW.post_id;
  
  -- Only create notification if mentioned user is not the post author
  IF NEW.mentioned_user_id != post_author_id THEN
    INSERT INTO notifications (
      user_id, 
      type, 
      actor_id, 
      actor_name, 
      actor_handle, 
      post_id
    )
    VALUES (
      NEW.mentioned_user_id, 
      'mention',
      post_author_id,
      post_author_name, 
      post_author_handle, 
      NEW.post_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on mentions table
DROP TRIGGER IF EXISTS on_mention_created ON public.mentions;
CREATE TRIGGER on_mention_created
  AFTER INSERT ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_mention_notification();