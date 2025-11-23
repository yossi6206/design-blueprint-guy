-- Create verification_requests table for users to request verified badge
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  reason TEXT NOT NULL,
  social_links TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on verification_requests
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_requests
CREATE POLICY "Users can view their own verification requests"
  ON public.verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification request"
  ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update their pending requests"
  ON public.verification_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (status = 'pending');

CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created_at ON public.verification_requests(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle verification approval
CREATE OR REPLACE FUNCTION public.approve_verification_request(request_id UUID, admin_user_id UUID, note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can approve verification requests';
  END IF;

  -- Get user_id from request
  SELECT user_id INTO target_user_id
  FROM verification_requests
  WHERE id = request_id;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  -- Update verification request
  UPDATE verification_requests
  SET 
    status = 'approved',
    admin_note = note,
    reviewed_by = admin_user_id,
    reviewed_at = now()
  WHERE id = request_id;

  -- Update profile to verified
  UPDATE profiles
  SET is_verified = true
  WHERE id = target_user_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, content)
  SELECT 
    target_user_id,
    'verification_approved',
    admin_user_id,
    p.user_name,
    p.user_handle,
    note
  FROM profiles p
  WHERE p.id = admin_user_id;
END;
$$;

-- Create function to handle verification rejection
CREATE OR REPLACE FUNCTION public.reject_verification_request(request_id UUID, admin_user_id UUID, note TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(admin_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can reject verification requests';
  END IF;

  -- Get user_id from request
  SELECT user_id INTO target_user_id
  FROM verification_requests
  WHERE id = request_id;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found';
  END IF;

  -- Update verification request
  UPDATE verification_requests
  SET 
    status = 'rejected',
    admin_note = note,
    reviewed_by = admin_user_id,
    reviewed_at = now()
  WHERE id = request_id;

  -- Create notification for user
  INSERT INTO notifications (user_id, type, actor_id, actor_name, actor_handle, content)
  SELECT 
    target_user_id,
    'verification_rejected',
    admin_user_id,
    p.user_name,
    p.user_handle,
    note
  FROM profiles p
  WHERE p.id = admin_user_id;
END;
$$;

-- Enable realtime for verification_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;