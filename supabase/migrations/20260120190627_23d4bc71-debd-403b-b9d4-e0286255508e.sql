-- Ajouter le rôle Tuteur à l'enum user_role
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Tuteur';