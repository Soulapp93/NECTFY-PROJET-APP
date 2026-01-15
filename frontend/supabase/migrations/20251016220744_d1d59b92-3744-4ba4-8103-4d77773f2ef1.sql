-- Supprimer les anciennes politiques qui causent la récursion
DROP POLICY IF EXISTS "Users can view shared files" ON public.digital_safe_files;
DROP POLICY IF EXISTS "Users can view establishment files" ON public.digital_safe_files;
DROP POLICY IF EXISTS "Users can manage their own files" ON public.digital_safe_files;

-- Créer une fonction SECURITY DEFINER pour vérifier les permissions sans récursion
CREATE OR REPLACE FUNCTION public.can_access_file(_file_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- L'utilisateur est propriétaire du fichier
    SELECT 1 FROM digital_safe_files 
    WHERE id = _file_id AND user_id = _user_id
  ) OR EXISTS (
    -- L'utilisateur a une permission directe sur le fichier
    SELECT 1 FROM digital_safe_file_permissions 
    WHERE file_id = _file_id AND user_id = _user_id
  ) OR EXISTS (
    -- L'utilisateur a un rôle qui a accès au fichier
    SELECT 1 FROM digital_safe_file_permissions dfp
    JOIN users u ON u.id = _user_id
    WHERE dfp.file_id = _file_id AND dfp.role = u.role::text
  ) OR EXISTS (
    -- L'utilisateur fait partie du même établissement
    SELECT 1 FROM digital_safe_files df
    JOIN users u ON u.id = _user_id
    WHERE df.id = _file_id AND df.establishment_id = u.establishment_id
  );
$$;

-- Créer des politiques simplifiées utilisant la fonction SECURITY DEFINER
CREATE POLICY "Users can select their accessible files"
ON public.digital_safe_files
FOR SELECT
TO authenticated
USING (can_access_file(id, auth.uid()));

CREATE POLICY "Users can insert their own files"
ON public.digital_safe_files
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND establishment_id = get_current_user_establishment());

CREATE POLICY "Users can update their own files"
ON public.digital_safe_files
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own files"
ON public.digital_safe_files
FOR DELETE
TO authenticated
USING (user_id = auth.uid());