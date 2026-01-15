-- Créer les politiques RLS pour le bucket coffre-fort-files
-- Politique pour permettre aux utilisateurs d'uploader leurs propres fichiers
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux utilisateurs de voir leurs propres fichiers
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres fichiers
CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Créer des tables pour les métadonnées du coffre-fort si elles n'existent pas
CREATE TABLE IF NOT EXISTS digital_safe_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_folder_id uuid REFERENCES digital_safe_folders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  establishment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_safe_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  content_type text,
  folder_id uuid REFERENCES digital_safe_folders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  establishment_id uuid,
  is_shared boolean DEFAULT false,
  shared_with_users text[],
  shared_with_roles text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Activer RLS sur ces tables
ALTER TABLE digital_safe_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_safe_files ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour digital_safe_folders
CREATE POLICY "Users can view their own folders"
ON digital_safe_folders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders"
ON digital_safe_folders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
ON digital_safe_folders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
ON digital_safe_folders
FOR DELETE
USING (auth.uid() = user_id);

-- Politiques RLS pour digital_safe_files
CREATE POLICY "Users can view their own files"
ON digital_safe_files
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files"
ON digital_safe_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
ON digital_safe_files
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
ON digital_safe_files
FOR DELETE
USING (auth.uid() = user_id);