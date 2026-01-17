-- Insérer un utilisateur temporaire pour les tests de soumission de devoirs
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  role,
  establishment_id,
  status,
  is_activated
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Utilisateur',
  'Temporaire',
  'temp@test.com',
  'Étudiant',
  'c67f6f7e-a567-4c8c-aad6-db15a4e27d65', -- ID de l'établissement existant
  'Actif',
  true
) ON CONFLICT (id) DO NOTHING;