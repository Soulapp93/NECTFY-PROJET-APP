-- Fix infinite recursion in RLS policies for internal messaging tables

-- 1) Helper functions (SECURITY DEFINER) to avoid recursive RLS evaluation
CREATE OR REPLACE FUNCTION public.is_message_sender(_message_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.id = _message_id
      AND m.sender_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_message(_message_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_message_sender(_message_id)
    OR EXISTS (
      SELECT 1
      FROM public.message_recipients mr
      WHERE mr.message_id = _message_id
        AND mr.recipient_id = auth.uid()
        AND mr.is_deleted = false
    )
  );
$$;

-- Ensure authenticated users can execute these helper functions
GRANT EXECUTE ON FUNCTION public.is_message_sender(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_message(uuid) TO authenticated;

-- 2) Replace policies to remove cross-table subqueries that can recurse
-- Messages
DROP POLICY IF EXISTS "Users can view messages they sent" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they received" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Messages: select if sender or recipient"
  ON public.messages
  FOR SELECT
  USING (public.can_access_message(id));

CREATE POLICY "Messages: insert own"
  ON public.messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Messages: update own"
  ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Messages: delete own"
  ON public.messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- Message recipients
DROP POLICY IF EXISTS "Users can view their own message recipient records" ON public.message_recipients;
DROP POLICY IF EXISTS "Message senders can create recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "Recipients can update their own records" ON public.message_recipients;
DROP POLICY IF EXISTS "Senders can delete recipients" ON public.message_recipients;

CREATE POLICY "Message recipients: select own or sender"
  ON public.message_recipients
  FOR SELECT
  USING (
    recipient_id = auth.uid()
    OR public.is_message_sender(message_id)
  );

CREATE POLICY "Message recipients: insert by sender"
  ON public.message_recipients
  FOR INSERT
  WITH CHECK (public.is_message_sender(message_id));

CREATE POLICY "Message recipients: update own"
  ON public.message_recipients
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Message recipients: delete by sender"
  ON public.message_recipients
  FOR DELETE
  USING (public.is_message_sender(message_id));

-- Message attachments
DROP POLICY IF EXISTS "Users can view attachments of messages they can see" ON public.message_attachments;
DROP POLICY IF EXISTS "Senders can create attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Senders can delete attachments" ON public.message_attachments;

CREATE POLICY "Message attachments: select if can access message"
  ON public.message_attachments
  FOR SELECT
  USING (public.can_access_message(message_id));

CREATE POLICY "Message attachments: insert by sender"
  ON public.message_attachments
  FOR INSERT
  WITH CHECK (public.is_message_sender(message_id));

CREATE POLICY "Message attachments: delete by sender"
  ON public.message_attachments
  FOR DELETE
  USING (public.is_message_sender(message_id));
