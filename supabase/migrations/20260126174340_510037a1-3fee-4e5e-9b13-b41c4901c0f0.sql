-- Tighten overly permissive policies flagged by linter

-- 1) chat_message_attachments: restrict to members of the message's group
DROP POLICY IF EXISTS "Create chat attachments" ON public.chat_message_attachments;
DROP POLICY IF EXISTS "View chat attachments" ON public.chat_message_attachments;

CREATE POLICY "Create chat attachments (members only)"
ON public.chat_message_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.chat_messages m
    JOIN public.chat_group_members gm ON gm.group_id = m.group_id
    WHERE m.id = chat_message_attachments.message_id
      AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "View chat attachments (members only)"
ON public.chat_message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_messages m
    JOIN public.chat_group_members gm ON gm.group_id = m.group_id
    WHERE m.id = chat_message_attachments.message_id
      AND gm.user_id = auth.uid()
  )
);

-- 2) notifications: ensure users can only create notifications for themselves
DROP POLICY IF EXISTS "Create notifications" ON public.notifications;

CREATE POLICY "Create own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3) establishments: avoid public inserts (use backend function/service role for provisioning)
DROP POLICY IF EXISTS "Allow public insert for signup" ON public.establishments;

CREATE POLICY "Authenticated create establishments"
ON public.establishments
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');