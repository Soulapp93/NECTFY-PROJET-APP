-- Supprimer les anciennes politiques qui causent la récursion
DROP POLICY IF EXISTS "Senders view messages" ON public.messages;
DROP POLICY IF EXISTS "Users create messages" ON public.messages;
DROP POLICY IF EXISTS "Users update messages" ON public.messages;

DROP POLICY IF EXISTS "Users view message recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "Users create recipients" ON public.message_recipients;
DROP POLICY IF EXISTS "Users update recipients" ON public.message_recipients;

DROP POLICY IF EXISTS "Users view accessible attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users create attachments" ON public.message_attachments;

-- Créer de nouvelles politiques SIMPLES sans récursion pour messages
-- L'utilisateur peut voir les messages qu'il a envoyés
CREATE POLICY "Sender can view own messages" 
ON public.messages 
FOR SELECT 
USING (sender_id = auth.uid());

-- L'utilisateur peut créer des messages
CREATE POLICY "User can create messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- L'utilisateur peut modifier ses propres messages
CREATE POLICY "User can update own messages" 
ON public.messages 
FOR UPDATE 
USING (sender_id = auth.uid());

-- Politique pour voir les messages reçus (via une fonction)
CREATE OR REPLACE FUNCTION public.is_message_recipient(msg_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM message_recipients mr
    WHERE mr.message_id = msg_id
    AND (
      (mr.recipient_type = 'user' AND mr.recipient_id = auth.uid())
      OR (mr.recipient_type = 'formation' AND mr.recipient_id IN (
        SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
      ))
      OR (mr.recipient_type = 'all_instructors' AND auth.uid() IN (
        SELECT id FROM users WHERE role = 'Formateur'
      ))
    )
  );
$$;

-- Politique pour voir les messages reçus
CREATE POLICY "Recipient can view received messages" 
ON public.messages 
FOR SELECT 
USING (public.is_message_recipient(id));

-- Politiques pour message_recipients SIMPLES
CREATE POLICY "Sender can manage recipients" 
ON public.message_recipients 
FOR ALL 
USING (
  message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
);

CREATE POLICY "Recipient can view own recipient entry" 
ON public.message_recipients 
FOR SELECT 
USING (
  (recipient_type = 'user' AND recipient_id = auth.uid())
  OR (recipient_type = 'formation' AND recipient_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  ))
  OR (recipient_type = 'all_instructors' AND auth.uid() IN (
    SELECT id FROM users WHERE role = 'Formateur'
  ))
);

CREATE POLICY "Recipient can update own entry" 
ON public.message_recipients 
FOR UPDATE 
USING (
  (recipient_type = 'user' AND recipient_id = auth.uid())
);

-- Politiques pour message_attachments SIMPLES
CREATE POLICY "Sender can manage attachments" 
ON public.message_attachments 
FOR ALL 
USING (
  message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())
);

CREATE POLICY "Recipient can view attachments" 
ON public.message_attachments 
FOR SELECT 
USING (public.is_message_recipient(message_id));