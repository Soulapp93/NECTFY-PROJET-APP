-- Corriger la politique INSERT qui utilise une fonction inexistante
DROP POLICY IF EXISTS "Users can insert their own files" ON public.digital_safe_files;

CREATE POLICY "Users can insert their own files"
ON public.digital_safe_files
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Vérifier que le bucket coffre-fort-files existe et est public
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'coffre-fort-files') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('coffre-fort-files', 'coffre-fort-files', true);
  ELSE
    UPDATE storage.buckets 
    SET public = true 
    WHERE id = 'coffre-fort-files';
  END IF;
END $$;

-- Supprimer les anciennes politiques de storage si elles existent
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Créer les politiques RLS pour le storage
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'coffre-fort-files');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files in storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);