-- Replace the problematic function with an empty one
CREATE OR REPLACE FUNCTION public.send_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Empty function - does nothing
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';