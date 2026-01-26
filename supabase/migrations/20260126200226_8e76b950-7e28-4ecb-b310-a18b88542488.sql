CREATE OR REPLACE FUNCTION public.enforce_message_sender_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Normal path: authenticated end-user (JWT contains sub)
  IF auth.uid() IS NOT NULL THEN
    -- Always enforce sender_id = auth.uid() (prevents spoofing)
    NEW.sender_id := auth.uid();
    RETURN NEW;
  END IF;

  -- Backend path: service role (no user sub). Allow inserts coming from backend functions
  -- that explicitly set sender_id.
  IF auth.role() = 'service_role' THEN
    IF NEW.sender_id IS NULL THEN
      RAISE EXCEPTION 'sender_id required for service_role inserts';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not authenticated';
END;
$$;