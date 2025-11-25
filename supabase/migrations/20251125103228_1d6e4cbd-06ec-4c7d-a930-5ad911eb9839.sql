-- Create function to send message notification email
CREATE OR REPLACE FUNCTION public.send_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_record RECORD;
  sender_profile RECORD;
BEGIN
  -- Get sender profile
  SELECT user_name, user_handle 
  INTO sender_profile
  FROM public.profiles 
  WHERE id = NEW.sender_id;

  -- Get recipient info from conversation participants
  FOR recipient_record IN
    SELECT 
      cp.user_id,
      p.user_name,
      au.email
    FROM public.conversation_participants cp
    INNER JOIN public.profiles p ON p.id = cp.user_id
    INNER JOIN auth.users au ON au.id = cp.user_id
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id != NEW.sender_id
  LOOP
    -- Call edge function to send email
    PERFORM net.http_post(
      url := current_setting('app.settings.api_url') || '/functions/v1/send-message-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'recipientEmail', recipient_record.email,
        'recipientName', recipient_record.user_name,
        'senderName', sender_profile.user_name,
        'senderHandle', sender_profile.user_handle,
        'messageContent', NEW.content,
        'conversationId', NEW.conversation_id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_message_notification();
