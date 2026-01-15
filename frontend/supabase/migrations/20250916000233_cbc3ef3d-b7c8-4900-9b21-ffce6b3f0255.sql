-- Créer les utilisateurs démo pour éviter les erreurs de foreign key
-- D'abord, supprimer les utilisateurs démo existants s'ils existent
DELETE FROM users WHERE id IN (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003'
);

-- Insérer l'utilisateur admin principal démo
INSERT INTO users (
  id,
  establishment_id,
  first_name,
  last_name,
  email,
  role,
  status,
  is_activated
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'c67f6f7e-a567-4c8c-aad6-db15a4e27d65',
  'Admin',
  'Principal',
  'admin@demo.com',
  'Admin',
  'Actif',
  true
);

-- Insérer l'utilisateur étudiant démo
INSERT INTO users (
  id,
  establishment_id,
  first_name,
  last_name,
  email,
  role,
  status,
  is_activated
) VALUES (
  '00000000-0000-4000-8000-000000000002',
  'c67f6f7e-a567-4c8c-aad6-db15a4e27d65',
  'Étudiant',
  'Démo',
  'etudiant@demo.com',
  'Étudiant',
  'Actif',
  true
);

-- Créer un utilisateur formateur démo aussi
INSERT INTO users (
  id,
  establishment_id,
  first_name,
  last_name,
  email,
  role,
  status,
  is_activated
) VALUES (
  '00000000-0000-4000-8000-000000000003',
  'c67f6f7e-a567-4c8c-aad6-db15a4e27d65',
  'Formateur',
  'Démo',
  'formateur@demo.com',
  'Formateur',
  'Actif',
  true
);