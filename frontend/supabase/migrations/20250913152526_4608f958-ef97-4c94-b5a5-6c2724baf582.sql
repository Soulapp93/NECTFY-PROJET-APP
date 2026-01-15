-- Fix infinite recursion in digital_safe_files RLS policies

-- Drop the current policy that causes recursion
DROP POLICY IF EXISTS "Users can manage their own files" ON digital_safe_files;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can manage their own files" 
ON digital_safe_files 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Users can view establishment files" 
ON digital_safe_files 
FOR SELECT 
USING (establishment_id = get_current_user_establishment());

CREATE POLICY "Users can view shared files" 
ON digital_safe_files 
FOR SELECT 
USING (
  is_shared = true AND (
    id IN (
      SELECT file_id FROM digital_safe_file_permissions 
      WHERE (user_id = auth.uid() OR role = get_current_user_role())
    )
  )
);