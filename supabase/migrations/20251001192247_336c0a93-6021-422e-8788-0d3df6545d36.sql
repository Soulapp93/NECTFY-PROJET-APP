-- Remove the overly permissive development policy that exposes all user data
DROP POLICY IF EXISTS "Development access for users" ON public.users;

-- Create proper RLS policies for the users table

-- Allow users to view other users in their establishment only
-- This is needed for instructor lists, student lists, formation assignments, etc.
CREATE POLICY "Users can view users in their establishment"
ON public.users
FOR SELECT
TO authenticated
USING (establishment_id = get_current_user_establishment());

-- Keep existing update policy that prevents role/establishment changes
-- The policy "Users can update their own profile" already exists with proper checks

-- Prevent unauthorized inserts (users should be created through admin functions)
CREATE POLICY "Only system can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Prevent unauthorized deletes (should be handled by admins through specific functions)
CREATE POLICY "Prevent direct user deletion"
ON public.users
FOR DELETE
TO authenticated
USING (false);