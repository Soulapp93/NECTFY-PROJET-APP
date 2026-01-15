-- Créer le bucket pour les fichiers du coffre-fort
INSERT INTO storage.buckets (id, name, public) VALUES ('coffre-fort-files', 'coffre-fort-files', false);

-- Créer la table pour les dossiers
CREATE TABLE public.digital_safe_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_folder_id uuid REFERENCES public.digital_safe_folders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  establishment_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Créer la table pour les fichiers
CREATE TABLE public.digital_safe_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_size integer NOT NULL,
  content_type text NOT NULL,
  folder_id uuid REFERENCES public.digital_safe_folders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  establishment_id uuid NOT NULL,
  is_shared boolean DEFAULT false,
  shared_with_users uuid[],
  shared_with_roles text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Créer la table pour les permissions de partage
CREATE TABLE public.digital_safe_file_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid NOT NULL REFERENCES public.digital_safe_files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role text,
  permission_type text NOT NULL DEFAULT 'view',
  granted_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS sur toutes les tables
ALTER TABLE public.digital_safe_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_safe_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_safe_file_permissions ENABLE ROW LEVEL SECURITY;

-- Créer les policies pour les dossiers
CREATE POLICY "Users can manage their own folders and view shared ones"
ON public.digital_safe_folders
FOR ALL
USING (
  user_id = auth.uid() 
  OR establishment_id = get_current_user_establishment()
);

-- Créer les policies pour les fichiers
CREATE POLICY "Users can manage their own files"
ON public.digital_safe_files
FOR ALL
USING (
  user_id = auth.uid() 
  OR establishment_id = get_current_user_establishment()
  OR id IN (
    SELECT file_id FROM public.digital_safe_file_permissions 
    WHERE user_id = auth.uid() OR role = get_current_user_role()
  )
);

-- Créer les policies pour les permissions
CREATE POLICY "Users can view permissions for their files"
ON public.digital_safe_file_permissions
FOR SELECT
USING (
  file_id IN (
    SELECT id FROM public.digital_safe_files 
    WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "File owners can grant permissions"
ON public.digital_safe_file_permissions
FOR INSERT
WITH CHECK (
  file_id IN (
    SELECT id FROM public.digital_safe_files 
    WHERE user_id = auth.uid()
  )
);

-- Créer les policies pour le storage
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files and shared files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'coffre-fort-files' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR name IN (
      SELECT file_path FROM public.digital_safe_files dsf
      JOIN public.digital_safe_file_permissions dfp ON dsf.id = dfp.file_id
      WHERE dfp.user_id = auth.uid() OR dfp.role = get_current_user_role()
    )
  )
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'coffre-fort-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Créer les triggers pour updated_at
CREATE TRIGGER update_digital_safe_folders_updated_at
  BEFORE UPDATE ON public.digital_safe_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_digital_safe_files_updated_at
  BEFORE UPDATE ON public.digital_safe_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();