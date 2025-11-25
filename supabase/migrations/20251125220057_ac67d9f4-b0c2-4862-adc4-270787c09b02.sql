-- Fix duplicate triggers causing double email notifications
-- The problem: There are two triggers on comments table that both create notifications
-- Trigger 1: on_comment_notify (from old migration)
-- Trigger 2: trigger_notify_on_comment (from newer migration)
-- Both call notify_on_comment() which creates a notification
-- Then trigger_send_email_on_notification sends an email for each notification
-- Result: Double emails!

-- Drop the old duplicate trigger
DROP TRIGGER IF EXISTS on_comment_notify ON public.comments;

-- Keep only trigger_notify_on_comment which already exists and works correctly