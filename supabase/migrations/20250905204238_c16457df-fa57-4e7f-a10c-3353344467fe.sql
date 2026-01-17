-- Ajouter une policy temporaire pour permettre l'accès aux utilisateurs pendant le développement
CREATE POLICY "Allow all for development users" 
ON public.users 
FOR ALL 
USING (true);