-- Create a trigger function to automatically create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  establishment_id_val uuid;
BEGIN
  -- Get the establishment_id from user metadata (we'll pass it during signup)
  establishment_id_val := (NEW.raw_user_meta_data->>'establishment_id')::uuid;
  
  -- Only create user if establishment_id is provided
  IF establishment_id_val IS NOT NULL THEN
    INSERT INTO public.users (
      id,
      first_name,
      last_name,
      email,
      phone,
      role,
      establishment_id,
      status,
      is_activated
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      'Admin',
      establishment_id_val,
      'Actif',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();