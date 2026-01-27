-- Move pgcrypto out of public schema (best practice)
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    -- Move the extension to the 'extensions' schema
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;

-- Ensure our function still resolves pgcrypto symbols after move
CREATE OR REPLACE FUNCTION public.generate_signature_token(sheet_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  new_token TEXT;
BEGIN
  new_token := encode(gen_random_bytes(32), 'hex');

  UPDATE public.attendance_sheets
  SET signature_link_token = new_token,
      signature_link_sent_at = now(),
      signature_link_expires_at = now() + interval '24 hours'
  WHERE id = sheet_id;

  RETURN new_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_signature_token(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_signature_token(uuid) TO authenticated;