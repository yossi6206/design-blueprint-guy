-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;

-- Create trigger to send email on new notification
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_email_on_notification();