-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can create establishments" ON establishments;
DROP POLICY IF EXISTS "Public create establishments" ON establishments;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON users;

-- Create PERMISSIVE policy for establishments (default is permissive)
CREATE POLICY "Public can create establishments"
ON establishments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create PERMISSIVE policy for users table - allow insert with matching auth ID
CREATE POLICY "Users can create their profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());