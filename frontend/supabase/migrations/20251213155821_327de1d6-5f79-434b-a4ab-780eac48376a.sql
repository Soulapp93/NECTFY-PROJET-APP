-- Ajouter une politique permettant aux tuteurs de voir leur propre enregistrement
-- Cela permet à un tuteur connecté de voir ses propres données même s'il n'est pas dans la table users

CREATE POLICY "Tutors can view their own record"
ON public.tutors
FOR SELECT
USING (auth.uid() = id);

-- Permettre aux tuteurs de modifier leur propre profil
CREATE POLICY "Tutors can update their own record"
ON public.tutors
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);