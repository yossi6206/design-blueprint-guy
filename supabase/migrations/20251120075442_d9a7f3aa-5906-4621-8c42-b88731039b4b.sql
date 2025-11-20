-- Drop old policies first (they depend on is_admin column)
DROP POLICY IF EXISTS "Admins can insert experiments" ON experiments;
DROP POLICY IF EXISTS "Admins can update experiments" ON experiments;
DROP POLICY IF EXISTS "Admins can delete experiments" ON experiments;
DROP POLICY IF EXISTS "Admins can insert variants" ON experiment_variants;
DROP POLICY IF EXISTS "Admins can update variants" ON experiment_variants;
DROP POLICY IF EXISTS "Admins can delete variants" ON experiment_variants;

-- Now we can safely remove is_admin from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;

-- Create enum for roles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create new secure policies for experiments
CREATE POLICY "Admins can insert experiments"
ON experiments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update experiments"
ON experiments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete experiments"
ON experiments FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all experiments"
ON experiments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR status = 'active');

-- Create new secure policies for experiment_variants
CREATE POLICY "Admins can insert variants"
ON experiment_variants FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update variants"
ON experiment_variants FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete variants"
ON experiment_variants FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all variants"
ON experiment_variants FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM experiments
    WHERE experiments.id = experiment_variants.experiment_id
    AND experiments.status = 'active'
  )
);

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));