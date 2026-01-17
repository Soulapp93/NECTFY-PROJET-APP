-- Assigner les utilisateurs démo à la formation de test pour permettre les tests complets
-- Supprimer les anciennes assignations s'il y en a
DELETE FROM user_formation_assignments WHERE user_id IN (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003'
) AND formation_id = '434eb514-3dde-4e4e-89eb-5c876089c42d';

-- Assigner l'admin à la formation démo
INSERT INTO user_formation_assignments (user_id, formation_id) 
VALUES ('00000000-0000-4000-8000-000000000001', '434eb514-3dde-4e4e-89eb-5c876089c42d')
ON CONFLICT (user_id, formation_id) DO NOTHING;

-- Assigner l'étudiant à la formation démo
INSERT INTO user_formation_assignments (user_id, formation_id) 
VALUES ('00000000-0000-4000-8000-000000000002', '434eb514-3dde-4e4e-89eb-5c876089c42d')
ON CONFLICT (user_id, formation_id) DO NOTHING;

-- Assigner le formateur à la formation démo
INSERT INTO user_formation_assignments (user_id, formation_id) 
VALUES ('00000000-0000-4000-8000-000000000003', '434eb514-3dde-4e4e-89eb-5c876089c42d')
ON CONFLICT (user_id, formation_id) DO NOTHING;