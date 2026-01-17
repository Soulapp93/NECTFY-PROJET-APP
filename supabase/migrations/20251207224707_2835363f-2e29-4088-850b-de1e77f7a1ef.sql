-- Add storage policy for establishment logos upload
CREATE POLICY "Admins can upload establishment logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'establishments'
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

-- Add storage policy for updating establishment logos
CREATE POLICY "Admins can update establishment logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'establishments'
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

-- Add storage policy for deleting establishment logos
CREATE POLICY "Admins can delete establishment logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'establishments'
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);