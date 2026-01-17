-- Créer d'abord les schedules fictifs
INSERT INTO schedules (
  id,
  formation_id,
  title,
  academic_year,
  status,
  created_by
) VALUES 
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Planning Web Full Stack 2025', '2024-2025', 'Actif', '9e7c0b33-4166-4311-bac2-00546d9e7249'),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Planning Marketing Digital 2025', '2024-2025', 'Actif', '9e7c0b33-4166-4311-bac2-00546d9e7249'),
('cccccccc-dddd-eeee-ffff-000000000000', 'd1a225ab-95d0-44a3-9304-fc779e49adcf', 'Planning Paie 2025', '2024-2025', 'Actif', '9e7c0b33-4166-4311-bac2-00546d9e7249');

-- Créer les schedule slots
INSERT INTO schedule_slots (
  id,
  schedule_id,
  date,
  start_time,
  end_time,
  module_id,
  instructor_id,
  room,
  color,
  notes
) VALUES 
('11111111-2222-3333-4444-555555555555', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '2025-01-20', '09:00:00', '12:00:00', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Salle A201', '#3B82F6', 'Session React Hooks'),
('22222222-3333-4444-5555-666666666666', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '2025-01-22', '14:00:00', '17:00:00', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Salle B102', '#3B82F6', 'API REST'),
('33333333-4444-5555-6666-777777777777', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '2025-01-25', '10:00:00', '13:00:00', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Salle C301', '#3B82F6', 'Base de données'),
('44444444-5555-6666-7777-888888888888', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff', '2025-02-05', '09:00:00', '12:00:00', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Salle D205', '#10B981', 'Stratégies SEO'),
('55555555-6666-7777-8888-999999999999', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff', '2025-02-07', '14:00:00', '16:30:00', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Salle E104', '#10B981', 'Réseaux sociaux'),
('66666666-7777-8888-9999-aaaaaaaaaaaa', 'cccccccc-dddd-eeee-ffff-000000000000', '2025-01-18', '08:30:00', '11:30:00', 'c24e4c0c-6bdc-4f2f-8891-06d76bfe8b6d', '22222222-2222-2222-2222-222222222222', 'Salle F203', '#F59E0B', 'Calculs de salaire');

-- Créer les feuilles d'émargement fictives
INSERT INTO attendance_sheets (
  schedule_slot_id,
  formation_id,
  title,
  date,
  start_time,
  end_time,
  instructor_id,
  room,
  status,
  generated_at,
  created_at,
  updated_at,
  is_open_for_signing
) VALUES 
('11111111-2222-3333-4444-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement Web Full Stack - Session React Hooks', '2025-01-20', '09:00:00', '12:00:00', '22222222-2222-2222-2222-222222222222', 'Salle A201', 'En attente de validation', now(), now(), now(), false),
('22222222-3333-4444-5555-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement Web Full Stack - API REST', '2025-01-22', '14:00:00', '17:00:00', '22222222-2222-2222-2222-222222222222', 'Salle B102', 'En attente de validation', now(), now(), now(), false),
('33333333-4444-5555-6666-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement Web Full Stack - Base de données', '2025-01-25', '10:00:00', '13:00:00', '22222222-2222-2222-2222-222222222222', 'Salle C301', 'En attente de validation', now(), now(), now(), false),
('44444444-5555-6666-7777-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Digital - Stratégies SEO', '2025-02-05', '09:00:00', '12:00:00', '22222222-2222-2222-2222-222222222222', 'Salle D205', 'En attente de validation', now(), now(), now(), false),
('55555555-6666-7777-8888-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Digital - Réseaux sociaux', '2025-02-07', '14:00:00', '16:30:00', '22222222-2222-2222-2222-222222222222', 'Salle E104', 'En attente de validation', now(), now(), now(), false),
('66666666-7777-8888-9999-aaaaaaaaaaaa', 'd1a225ab-95d0-44a3-9304-fc779e49adcf', 'la paie - Calculs de salaire', '2025-01-18', '08:30:00', '11:30:00', '22222222-2222-2222-2222-222222222222', 'Salle F203', 'En attente de validation', now(), now(), now(), false);

-- Ajouter quelques signatures fictives pour rendre les tests plus réalistes
INSERT INTO attendance_signatures (
  attendance_sheet_id,
  user_id,
  user_type,
  present,
  signed_at,
  signature_data
) VALUES 
-- Signatures pour la première feuille (React Hooks)
((SELECT id FROM attendance_sheets WHERE title = 'Développement Web Full Stack - Session React Hooks'), '33333333-3333-3333-3333-333333333333', 'student', true, now(), null),
((SELECT id FROM attendance_sheets WHERE title = 'Développement Web Full Stack - Session React Hooks'), '44444444-4444-4444-4444-444444444444', 'student', true, now(), null),
((SELECT id FROM attendance_sheets WHERE title = 'Développement Web Full Stack - Session React Hooks'), '55555555-5555-5555-5555-555555555555', 'student', false, now(), null),
((SELECT id FROM attendance_sheets WHERE title = 'Développement Web Full Stack - Session React Hooks'), '22222222-2222-2222-2222-222222222222', 'instructor', true, now(), 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIj48cGF0aCBkPSJNMTAgNDBMMTkwIDQwIiBzdHJva2U9IiMwMDAiLz48L3N2Zz4='),

-- Signatures pour la deuxième feuille (API REST)
((SELECT id FROM attendance_sheets WHERE title = 'Développement Web Full Stack - API REST'), '33333333-3333-3333-3333-333333333333', 'student', true, now(), null),
((SELECT id FROM attendance_sheets WHERE title = 'Développement Web Full Stack - API REST'), '44444444-4444-4444-4444-444444444444', 'student', false, now(), null),
((SELECT id FROM attendance_sheets WHERE title = 'Développement Web Full Stack - API REST'), '22222222-2222-2222-2222-222222222222', 'instructor', true, now(), 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIj48cGF0aCBkPSJNMTAgNDBMMTkwIDQwIiBzdHJva2U9IiMwMDAiLz48L3N2Zz4=');