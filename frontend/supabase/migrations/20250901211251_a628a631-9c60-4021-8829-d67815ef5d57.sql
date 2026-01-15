
-- Créer le bucket de stockage pour les fichiers des modules
INSERT INTO storage.buckets (id, name, public)
VALUES ('module-files', 'module-files', true);

-- Créer les politiques RLS pour le bucket module-files
-- Permettre à tous les utilisateurs authentifiés de télécharger des fichiers
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'module-files' AND
  auth.role() = 'authenticated'
);

-- Permettre à tous les utilisateurs authentifiés de voir les fichiers
CREATE POLICY "Authenticated users can view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'module-files' AND
  auth.role() = 'authenticated'
);

-- Permettre aux utilisateurs authentifiés de supprimer leurs propres fichiers
CREATE POLICY "Authenticated users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'module-files' AND
  auth.role() = 'authenticated'
);

-- Permettre aux utilisateurs authentifiés de mettre à jour leurs fichiers
CREATE POLICY "Authenticated users can update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'module-files' AND
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'module-files' AND
  auth.role() = 'authenticated'
);
