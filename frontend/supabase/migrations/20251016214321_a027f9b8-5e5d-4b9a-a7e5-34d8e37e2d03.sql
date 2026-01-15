-- Rendre le bucket coffre-fort-files public pour permettre l'accès aux viewers externes
UPDATE storage.buckets
SET public = true
WHERE name = 'coffre-fort-files';

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view coffre-fort files from their establishment" ON storage.objects;
DROP POLICY IF EXISTS "Users can view shared coffre-fort files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their coffre-fort" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own coffre-fort files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own coffre-fort files" ON storage.objects;

-- Policy pour permettre la lecture des fichiers du coffre-fort pour les utilisateurs du même établissement
CREATE POLICY "Users can view coffre-fort files from their establishment"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'coffre-fort-files' 
  AND name IN (
    SELECT file_path 
    FROM digital_safe_files 
    WHERE establishment_id = get_current_user_establishment()
  )
);

-- Policy pour permettre la lecture des fichiers partagés
CREATE POLICY "Users can view shared coffre-fort files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'coffre-fort-files'
  AND name IN (
    SELECT file_path
    FROM digital_safe_files
    WHERE is_shared = true
    AND (
      user_id = auth.uid()
      OR id IN (
        SELECT file_id
        FROM digital_safe_file_permissions
        WHERE user_id = auth.uid() OR role = get_current_user_role()
      )
    )
  )
);

-- Policy pour permettre l'upload uniquement aux utilisateurs authentifiés dans leur propre espace
CREATE POLICY "Users can upload to their coffre-fort"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coffre-fort-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy pour permettre la mise à jour uniquement des fichiers de l'utilisateur
CREATE POLICY "Users can update their own coffre-fort files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'coffre-fort-files'
  AND name IN (
    SELECT file_path
    FROM digital_safe_files
    WHERE user_id = auth.uid()
  )
);

-- Policy pour permettre la suppression uniquement des fichiers de l'utilisateur
CREATE POLICY "Users can delete their own coffre-fort files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'coffre-fort-files'
  AND name IN (
    SELECT file_path
    FROM digital_safe_files
    WHERE user_id = auth.uid()
  )
);