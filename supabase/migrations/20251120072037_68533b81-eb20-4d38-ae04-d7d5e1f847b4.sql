-- Add is_verified column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Create an index for better performance when filtering verified users
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);