-- Fix internal messaging INSERT failing due to RLS evaluation order / identity mismatch

BEGIN;

-- 1) Ensure sender_id is always the authenticated user (server-enforced)
CREATE OR REPLACE FUNCTION public.enforce_message_sender_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Always enforce sender_id = auth.uid() (prevents spoofing and avoids client mismatch)
  NEW.sender_id := auth.uid();

  RETURN NEW;
END;
$$;

-- Allow authenticated users to execute the trigger function (trigger runs as table owner, but keep explicit)
GRANT EXECUTE ON FUNCTION public.enforce_message_sender_id() TO authenticated;

DROP TRIGGER IF EXISTS trg_enforce_message_sender_id ON public.messages;
CREATE TRIGGER trg_enforce_message_sender_id
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_message_sender_id();

-- 2) Make INSERT policy role-scoped and simple; sender_id enforcement is done by trigger
DROP POLICY IF EXISTS "Messages: insert own" ON public.messages;
CREATE POLICY "Messages: insert (authenticated)"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Keep UPDATE/DELETE restricted to sender
-- (recreate with role scoping for clarity)
DROP POLICY IF EXISTS "Messages: update own" ON public.messages;
CREATE POLICY "Messages: update own"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Messages: delete own" ON public.messages;
CREATE POLICY "Messages: delete own"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- 3) Recipients / attachments: scope to authenticated as well (no logic change)
ALTER POLICY "Message recipients: insert by sender" ON public.message_recipients TO authenticated;
ALTER POLICY "Message recipients: update own" ON public.message_recipients TO authenticated;
ALTER POLICY "Message recipients: delete by sender" ON public.message_recipients TO authenticated;
ALTER POLICY "Message recipients: select own or sender" ON public.message_recipients TO authenticated;

ALTER POLICY "Message attachments: insert by sender" ON public.message_attachments TO authenticated;
ALTER POLICY "Message attachments: delete by sender" ON public.message_attachments TO authenticated;
ALTER POLICY "Message attachments: select if can access message" ON public.message_attachments TO authenticated;

-- 4) Messages SELECT policy: scope to authenticated (no logic change)
ALTER POLICY "Messages: select if sender or recipient" ON public.messages TO authenticated;

COMMIT;