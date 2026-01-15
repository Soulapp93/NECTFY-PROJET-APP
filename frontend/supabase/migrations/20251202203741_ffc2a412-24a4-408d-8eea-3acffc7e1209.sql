-- Create a SECURITY DEFINER function to create establishments
-- This bypasses RLS and is the standard pattern for public signup flows
CREATE OR REPLACE FUNCTION public.create_establishment_public(
  p_name TEXT,
  p_type TEXT,
  p_email TEXT,
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_siret TEXT DEFAULT NULL,
  p_director TEXT DEFAULT NULL,
  p_number_of_students TEXT DEFAULT NULL,
  p_number_of_instructors TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_establishment_id UUID;
BEGIN
  INSERT INTO establishments (
    name,
    type,
    email,
    address,
    phone,
    website,
    siret,
    director,
    number_of_students,
    number_of_instructors
  ) VALUES (
    p_name,
    p_type,
    p_email,
    p_address,
    p_phone,
    p_website,
    p_siret,
    p_director,
    p_number_of_students,
    p_number_of_instructors
  )
  RETURNING id INTO new_establishment_id;
  
  RETURN new_establishment_id;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.create_establishment_public TO anon;
GRANT EXECUTE ON FUNCTION public.create_establishment_public TO authenticated;