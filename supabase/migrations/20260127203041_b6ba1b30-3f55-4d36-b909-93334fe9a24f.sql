-- Fix token generation: ensure pgcrypto is available for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate function to ensure it compiles in this environment
CREATE OR REPLACE FUNCTION public.generate_signature_token(sheet_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- pgcrypto
  new_token := encode(gen_random_bytes(32), 'hex');

  UPDATE public.attendance_sheets
  SET signature_link_token = new_token,
      signature_link_sent_at = now(),
      signature_link_expires_at = now() + interval '24 hours'
  WHERE id = sheet_id;

  RETURN new_token;
END;
$$;

-- Permissions: callable by authenticated users only
REVOKE EXECUTE ON FUNCTION public.generate_signature_token(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_signature_token(uuid) TO authenticated;