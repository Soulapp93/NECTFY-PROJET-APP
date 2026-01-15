-- Créer des comptes utilisateurs démo pour les tests
-- Supprime les anciens comptes démo s'ils existent
DELETE FROM users WHERE email IN ('admin@demo.com', 'formateur@demo.com', 'etudiant@demo.com');

-- Insérer les comptes démo avec des UUID générés
INSERT INTO users (id, first_name, last_name, email, role, status, establishment_id, is_activated)
VALUES 
  (
    gen_random_uuid(),
    'Admin',
    'Demo',
    'admin@demo.com',
    'Admin',
    'Actif',
    (SELECT id FROM establishments LIMIT 1),
    true
  ),
  (
    gen_random_uuid(),
    'Formateur',
    'Demo',
    'formateur@demo.com',
    'Formateur',
    'Actif',
    (SELECT id FROM establishments LIMIT 1),
    true
  ),
  (
    gen_random_uuid(),
    'Étudiant',
    'Demo',
    'etudiant@demo.com',
    'Étudiant',
    'Actif',
    (SELECT id FROM establishments LIMIT 1),
    true
  );