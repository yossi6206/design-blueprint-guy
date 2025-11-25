-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call edge function on password recovery
CREATE OR REPLACE FUNCTION public.send_recovery_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recovery_link text;
  user_email text;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Build recovery link with token
  recovery_link := NEW.redirect_to || '&token=' || NEW.token_hash || '&type=recovery';
  
  -- Call edge function via pg_net
  PERFORM net.http_post(
    url := 'https://kwpiinlgptnaazqzemvv.supabase.co/functions/v1/send-reset-password-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cGlpbmxncHRuYWF6cXplbXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDkzNTQsImV4cCI6MjA3NzEyNTM1NH0.LvqsyhBA-pFOStZ70Y96wlBE0qFdzD5zmoOnxJpz7Io'
    ),
    body := jsonb_build_object(
      'email', user_email,
      'resetLink', recovery_link
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.identities for password recovery
-- Note: We'll use auth schema trigger through a public schema function
COMMENT ON FUNCTION public.send_recovery_email() IS 'Sends custom recovery email when password reset is requested';