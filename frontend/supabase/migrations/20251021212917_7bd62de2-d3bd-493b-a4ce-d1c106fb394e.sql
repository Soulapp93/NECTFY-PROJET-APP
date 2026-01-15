
-- Supprimer TOUTES les politiques pour recommencer proprement
DROP POLICY IF EXISTS "Users can view their own group memberships" ON chat_group_members;
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON chat_group_members;
DROP POLICY IF EXISTS "Users can join groups they have access to" ON chat_group_members;
DROP POLICY IF EXISTS "Users can leave their groups" ON chat_group_members;

-- Politique ULTRA SIMPLE pour SELECT : on peut voir tous les membres de tous les groupes
-- (c'est acceptable car les noms des groupes et membres ne sont pas sensibles dans ce contexte)
CREATE POLICY "Anyone authenticated can view group members"
ON chat_group_members
FOR SELECT
TO authenticated
USING (true);

-- Politique INSERT : on peut s'ajouter soi-même
CREATE POLICY "Users can add themselves to groups"
ON chat_group_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Politique DELETE : on peut se retirer soi-même
CREATE POLICY "Users can remove themselves from groups"
ON chat_group_members
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Politique UPDATE : interdite pour l'instant
CREATE POLICY "No updates allowed"
ON chat_group_members
FOR UPDATE
TO authenticated
USING (false);
