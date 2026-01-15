
-- TEMPORAIRE : Permettre l'accès public comme les autres tables du projet
-- (similaire à "Allow all for development" sur formations, users, etc.)

DROP POLICY IF EXISTS "Anyone authenticated can view group members" ON chat_group_members;
DROP POLICY IF EXISTS "Users can add themselves to groups" ON chat_group_members;
DROP POLICY IF EXISTS "Users can remove themselves from groups" ON chat_group_members;
DROP POLICY IF EXISTS "No updates allowed" ON chat_group_members;

CREATE POLICY "Allow all for development - chat_group_members"
ON chat_group_members
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view all groups" ON chat_groups;
DROP POLICY IF EXISTS "Admins can create groups" ON chat_groups;
DROP POLICY IF EXISTS "Admins can update groups" ON chat_groups;

CREATE POLICY "Allow all for development - chat_groups"
ON chat_groups
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can send messages to their groups" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their groups" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

CREATE POLICY "Allow all for development - chat_messages"
ON chat_messages
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can add attachments to their messages" ON chat_message_attachments;
DROP POLICY IF EXISTS "Users can view attachments in their groups" ON chat_message_attachments;

CREATE POLICY "Allow all for development - chat_message_attachments"
ON chat_message_attachments
FOR ALL
USING (true)
WITH CHECK (true);
