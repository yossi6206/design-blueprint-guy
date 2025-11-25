-- Drop the problematic trigger that's preventing messages from being sent
DROP TRIGGER IF EXISTS send_message_notification_email ON public.messages;
DROP FUNCTION IF EXISTS public.notify_new_message();