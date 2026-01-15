
-- Supprimer les anciennes politiques s'elles existent
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;

-- Créer des politiques plus permissives pour le bucket module-files
CREATE POLICY "Allow all operations on module-files bucket" ON storage.objects
FOR ALL USING (bucket_id = 'module-files')
WITH CHECK (bucket_id = 'module-files');

-- S'assurer que le bucket existe et est public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('module-files', 'module-files', true, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain', 'video/mp4', 'video/avi', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/jpg', 'text/plain', 'video/mp4', 'video/avi', 'video/quicktime'];
