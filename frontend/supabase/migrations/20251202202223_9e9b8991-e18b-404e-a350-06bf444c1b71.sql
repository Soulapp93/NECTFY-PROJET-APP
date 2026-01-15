-- First, let's drop ALL existing INSERT policies on establishments to start fresh
DROP POLICY IF EXISTS "Allow public establishment creation" ON public.establishments;
DROP POLICY IF EXISTS "Public can create establishments" ON public.establishments;
DROP POLICY IF EXISTS "Service role full access" ON public.establishments;

-- Create a single permissive policy for INSERT that works for everyone
CREATE POLICY "Anyone can create establishment" 
ON public.establishments 
FOR INSERT 
WITH CHECK (true);

-- Recreate the service role policy for other operations
CREATE POLICY "Service role full access"
ON public.establishments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);