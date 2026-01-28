-- Ajouter une politique permettant aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());