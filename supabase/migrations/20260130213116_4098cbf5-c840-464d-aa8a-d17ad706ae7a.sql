-- Add storage policies for avatars bucket to allow admins to upload establishment logos

-- Policy for admins to upload establishment logos
CREATE POLICY "Admins can upload establishment logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'establishments'
  AND public.is_current_user_admin()
);

-- Policy for admins to update establishment logos
CREATE POLICY "Admins can update establishment logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'establishments'
  AND public.is_current_user_admin()
);

-- Policy for admins to delete establishment logos
CREATE POLICY "Admins can delete establishment logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'establishments'
  AND public.is_current_user_admin()
);

-- Policy for anyone to view avatars (public bucket)
CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');