-- Drop any existing triggers on notifications table for email sending
DROP TRIGGER IF EXISTS send_email_on_notification_trigger ON notifications;
DROP TRIGGER IF EXISTS trigger_send_email_on_notification ON notifications;
DROP TRIGGER IF EXISTS after_notification_insert ON notifications;

-- Create a single, clean trigger for email notifications
CREATE TRIGGER send_email_on_notification_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_email_on_notification();