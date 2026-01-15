-- Drop the current INSERT policy
DROP POLICY IF EXISTS "Anyone can create establishment" ON public.establishments;

-- Create INSERT policy explicitly for anon role
CREATE POLICY "Anon can create establishment" 
ON public.establishments 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Also add for authenticated in case they need it later
CREATE POLICY "Authenticated can create establishment" 
ON public.establishments 
FOR INSERT 
TO authenticated
WITH CHECK (true);