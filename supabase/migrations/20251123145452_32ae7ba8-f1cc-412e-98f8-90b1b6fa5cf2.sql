-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to send email notification when a new notification is created
CREATE OR REPLACE FUNCTION public.send_email_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  post_text text;
  request_id bigint;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Skip if no email found
  IF user_email IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get post content if post_id exists
  IF NEW.post_id IS NOT NULL THEN
    SELECT content INTO post_text
    FROM posts
    WHERE id = NEW.post_id;
  END IF;
  
  -- Call the edge function to send email using pg_net
  SELECT INTO request_id net.http_post(
    url := 'https://kwpiinlgptnaazqzemvv.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cGlpbmxncHRuYWF6cXplbXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDkzNTQsImV4cCI6MjA3NzEyNTM1NH0.LvqsyhBA-pFOStZ70Y96wlBE0qFdzD5zmoOnxJpz7Io'
    ),
    body := jsonb_build_object(
      'user_email', user_email,
      'type', NEW.type,
      'actor_name', NEW.actor_name,
      'actor_handle', NEW.actor_handle,
      'content', NEW.content,
      'post_content', post_text
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to call the function when a notification is inserted
DROP TRIGGER IF EXISTS trigger_send_email_on_notification ON notifications;
CREATE TRIGGER trigger_send_email_on_notification
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_email_on_notification();