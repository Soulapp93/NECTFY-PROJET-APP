
-- Supprimer les anciennes politiques RLS problématiques
DROP POLICY IF EXISTS "Users can view members of their groups" ON chat_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON chat_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON chat_group_members;

-- Créer une fonction security definer pour vérifier si un utilisateur est membre d'un groupe
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM chat_group_members
    WHERE user_id = _user_id
    AND group_id = _group_id
  )
$$;

-- Créer des politiques RLS simples sans récursion
CREATE POLICY "Users can view their own group memberships"
ON chat_group_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view members of groups they belong to"
ON chat_group_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_groups cg
    WHERE cg.id = group_id
    AND public.is_group_member(auth.uid(), cg.id)
  )
);

CREATE POLICY "Users can join groups they have access to"
ON chat_group_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave their groups"
ON chat_group_members
FOR DELETE
USING (user_id = auth.uid());
