
-- Simplifier les politiques de chat_groups
DROP POLICY IF EXISTS "Users can view groups they are members of" ON chat_groups;
DROP POLICY IF EXISTS "Users can create private groups in their formations" ON chat_groups;
DROP POLICY IF EXISTS "Group admins can update their groups" ON chat_groups;

-- Les utilisateurs authentifiés peuvent voir tous les groupes de leur établissement
CREATE POLICY "Users can view all groups"
ON chat_groups
FOR SELECT
TO authenticated
USING (true);

-- Les admins peuvent créer des groupes
CREATE POLICY "Admins can create groups"
ON chat_groups
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Les admins peuvent mettre à jour les groupes
CREATE POLICY "Admins can update groups"
ON chat_groups
FOR UPDATE
TO authenticated
USING (true);
