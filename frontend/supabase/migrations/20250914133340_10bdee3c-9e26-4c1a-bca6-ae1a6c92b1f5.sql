-- Ajouter une colonne pour l'URL de la photo de profil dans la table users
ALTER TABLE public.users ADD COLUMN profile_photo_url TEXT;