-- Create trigger to send email notification when a new message is sent
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  recipient_email text;
BEGIN
  -- Get the recipient (the other participant in the conversation)
  SELECT user_id INTO recipient_id
  FROM conversation_participants
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
  LIMIT 1;

  -- Get recipient email
  SELECT email INTO recipient_email
  FROM auth.users
  WHERE id = recipient_id;

  -- Send email notification via edge function
  IF recipient_email IS NOT NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.api_url') || '/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'to', recipient_email,
        'type', 'message',
        'actorName', NEW.sender_name,
        'actorHandle', NEW.sender_handle,
        'content', NEW.content
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS send_message_notification_email ON public.messages;
CREATE TRIGGER send_message_notification_email
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();