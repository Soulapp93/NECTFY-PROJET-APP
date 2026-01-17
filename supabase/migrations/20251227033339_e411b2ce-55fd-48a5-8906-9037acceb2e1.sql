-- Ajouter une policy SELECT explicite pour le bucket module-files (lecture publique)
CREATE POLICY "Public can read module-files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'module-files');

-- S'assurer que le bucket est bien configuré comme public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'module-files';