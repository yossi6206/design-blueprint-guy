-- Fix handle_new_user function to correctly extract user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
  extracted_handle TEXT;
BEGIN
  -- Extract user_name from raw_user_meta_data, fallback to email prefix
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Extract user_handle from raw_user_meta_data, fallback to email prefix with user_ prefix
  extracted_handle := COALESCE(
    NEW.raw_user_meta_data->>'user_handle',
    NEW.raw_user_meta_data->>'handle',
    'user_' || substring(NEW.id::text, 1, 8)
  );

  -- Insert into profiles table
  INSERT INTO public.profiles (id, user_name, user_handle, avatar_url)
  VALUES (
    NEW.id,
    extracted_name,
    extracted_handle,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;