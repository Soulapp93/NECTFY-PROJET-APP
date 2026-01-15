-- Drop existing INSERT policy and recreate with proper permissions
DROP POLICY IF EXISTS "Public can create establishments" ON public.establishments;

-- Create a truly permissive INSERT policy for public establishment creation
CREATE POLICY "Allow public establishment creation" 
ON public.establishments 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also ensure the policy works for service role
DROP POLICY IF EXISTS "Service role full access" ON public.establishments;
CREATE POLICY "Service role full access"
ON public.establishments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);