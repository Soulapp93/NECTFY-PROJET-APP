-- Corriger le conflit de politique INSERT
DROP POLICY IF EXISTS "Users can insert their own files" ON public.digital_safe_files;

CREATE POLICY "Users can insert their own files"
ON public.digital_safe_files
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- S'assurer que les politiques de storage sont correctes
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in storage" ON storage.objects;

-- Politique pour accès public en lecture (bucket public)
CREATE POLICY "Anyone can view public bucket files"
ON storage.objects FOR SELECT
USING (bucket_id = 'coffre-fort-files');

-- Politique pour upload (users authentifiés)
CREATE POLICY "Authenticated users can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coffre-fort-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour update (propriétaires seulement)
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'coffre-fort-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour delete (propriétaires seulement)
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'coffre-fort-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);