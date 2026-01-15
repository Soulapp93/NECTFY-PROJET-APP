-- Drop the existing policy that doesn't work
DROP POLICY IF EXISTS "Public can create first establishment" ON establishments;

-- Create a new policy that allows anyone (including anonymous users) to insert establishments
-- This is needed for the self-registration flow where establishments are created before user auth
CREATE POLICY "Anyone can create establishments"
ON establishments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also ensure users table allows insert with the auth user's ID
DROP POLICY IF EXISTS "Public can create first admin user" ON users;

-- Allow insertion when the user ID matches the auth user's ID (for self-registration)
CREATE POLICY "Authenticated users can create their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());