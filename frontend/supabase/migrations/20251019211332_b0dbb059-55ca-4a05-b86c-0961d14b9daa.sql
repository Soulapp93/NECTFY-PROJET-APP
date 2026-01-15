-- Créer une fonction pour vérifier si l'utilisateur actuel est admin
-- Cela évite la récursion infinie dans les politiques RLS
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Admin'
  );
$$;

-- Supprimer l'ancienne politique qui bloque toutes les insertions
DROP POLICY IF EXISTS "Only system can insert users" ON public.users;

-- Créer une nouvelle politique qui permet aux admins de créer des utilisateurs
CREATE POLICY "Admins can create users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

-- Permettre aux admins de supprimer des utilisateurs
DROP POLICY IF EXISTS "Prevent direct user deletion" ON public.users;

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_current_user_admin());

-- Mettre à jour la politique de mise à jour pour les admins
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin());

-- Permettre aux admins de voir tous les utilisateurs de leur établissement
DROP POLICY IF EXISTS "Users can view users in their establishment" ON public.users;

CREATE POLICY "Users can view establishment users"
ON public.users
FOR SELECT
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM public.users WHERE id = auth.uid()
  )
);