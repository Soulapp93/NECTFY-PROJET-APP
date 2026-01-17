-- Insérer des données fictives pour tester les feuilles d'émargement

-- Créer un établissement de test
INSERT INTO public.establishments (id, name, email, type, address, phone, website) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Institut de Formation Professionnelle',
  'contact@ifp-formation.fr',
  'centre de formation',
  '123 Avenue de la Formation, 75001 Paris',
  '01 23 45 67 89',
  'https://ifp-formation.fr'
) ON CONFLICT (id) DO NOTHING;

-- Créer des utilisateurs de test
INSERT INTO public.users (id, first_name, last_name, email, role, establishment_id, status, is_activated) VALUES
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Marie', 'Dupont', 'marie.dupont@ifp.fr', 'Formateur'::user_role, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Actif'::user_status, true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Pierre', 'Martin', 'pierre.martin@ifp.fr', 'Formateur'::user_role, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Actif'::user_status, true),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Julie', 'Bernard', 'julie.bernard@student.fr', 'Étudiant'::user_role, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Actif'::user_status, true),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Thomas', 'Petit', 'thomas.petit@student.fr', 'Étudiant'::user_role, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Actif'::user_status, true),
  ('55555555-5555-5555-5555-555555555555'::uuid, 'Sophie', 'Leroy', 'sophie.leroy@student.fr', 'Étudiant'::user_role, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Actif'::user_status, true),
  ('66666666-6666-6666-6666-666666666666'::uuid, 'Antoine', 'Moreau', 'antoine.moreau@student.fr', 'Étudiant'::user_role, '550e8400-e29b-41d4-a716-446655440000'::uuid, 'Actif'::user_status, true)
ON CONFLICT (id) DO NOTHING;

-- Créer des formations de test
INSERT INTO public.formations (id, title, description, level, duration, max_students, price, start_date, end_date, establishment_id, color, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Développement Web Full Stack', 'Formation complète en développement web avec React et Node.js', 'Débutant', 480, 25, 2500.00, '2025-01-15', '2025-06-15', '550e8400-e29b-41d4-a716-446655440000'::uuid, '#3B82F6', 'Actif'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Marketing Digital', 'Formation en stratégies marketing digitales et réseaux sociaux', 'Intermédiaire', 320, 20, 1800.00, '2025-02-01', '2025-05-30', '550e8400-e29b-41d4-a716-446655440000'::uuid, '#10B981', 'Actif')
ON CONFLICT (id) DO NOTHING;

-- Créer des modules de formation
INSERT INTO public.formation_modules (id, formation_id, title, description, duration_hours, order_index) VALUES
  ('m1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'HTML/CSS Fondamentaux', 'Apprentissage des bases du développement web', 40, 1),
  ('m2222222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'JavaScript ES6+', 'JavaScript moderne et programmation orientée objet', 60, 2),
  ('m3333333-3333-3333-3333-333333333333'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Framework React', 'Développement applications avec React', 80, 3),
  ('m4444444-4444-4444-4444-444444444444'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'SEO et Analytics', 'Optimisation pour les moteurs de recherche', 30, 1),
  ('m5555555-5555-5555-5555-555555555555'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Publicité en ligne', 'Google Ads et Facebook Ads', 45, 2)
ON CONFLICT (id) DO NOTHING;

-- Inscrire les étudiants aux formations
INSERT INTO public.student_formations (formation_id, student_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '44444444-4444-4444-4444-444444444444'::uuid),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '55555555-5555-5555-5555-555555555555'::uuid),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '55555555-5555-5555-5555-555555555555'::uuid),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '66666666-6666-6666-6666-666666666666'::uuid)
ON CONFLICT DO NOTHING;

-- Créer des emplois du temps
INSERT INTO public.schedules (id, formation_id, title, academic_year, status, created_by) VALUES
  ('s1111111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Planning Développement Web 2025', '2024-2025', 'Publié', '11111111-1111-1111-1111-111111111111'::uuid),
  ('s2222222-2222-2222-2222-222222222222'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 'Planning Marketing Digital 2025', '2024-2025', 'Publié', '22222222-2222-2222-2222-222222222222'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Créer des créneaux emploi du temps (aujourd hui et demain)
INSERT INTO public.schedule_slots (id, schedule_id, module_id, instructor_id, date, start_time, end_time, room, color, notes) VALUES
  -- Cours aujourd hui
  ('slot1111-1111-1111-1111-111111111111'::uuid, 's1111111-1111-1111-1111-111111111111'::uuid, 'm1111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, CURRENT_DATE, '09:00:00', '12:00:00', 'Salle A101', '#3B82F6', 'Introduction HTML/CSS'),
  ('slot2222-2222-2222-2222-222222222222'::uuid, 's1111111-1111-1111-1111-111111111111'::uuid, 'm2222222-2222-2222-2222-222222222222'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, CURRENT_DATE, '14:00:00', '17:00:00', 'Salle A102', '#3B82F6', 'Bases JavaScript'),
  ('slot3333-3333-3333-3333-333333333333'::uuid, 's2222222-2222-2222-2222-222222222222'::uuid, 'm4444444-4444-4444-4444-444444444444'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, CURRENT_DATE, '10:00:00', '13:00:00', 'Salle B201', '#10B981', 'SEO Technique'),
  -- Cours de demain
  ('slot4444-4444-4444-4444-444444444444'::uuid, 's1111111-1111-1111-1111-111111111111'::uuid, 'm3333333-3333-3333-3333-333333333333'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '12:00:00', 'Salle A103', '#3B82F6', 'Introduction React'),
  ('slot5555-5555-5555-5555-555555555555'::uuid, 's2222222-2222-2222-2222-222222222222'::uuid, 'm5555555-5555-5555-5555-555555555555'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, CURRENT_DATE + INTERVAL '1 day', '14:00:00', '16:00:00', 'Salle B202', '#10B981', 'Google Ads')
ON CONFLICT (id) DO NOTHING;

-- Créer des feuilles émargement pour aujourd hui
INSERT INTO public.attendance_sheets (id, schedule_slot_id, formation_id, instructor_id, title, date, start_time, end_time, room, status) VALUES
  ('att11111-1111-1111-1111-111111111111'::uuid, 'slot1111-1111-1111-1111-111111111111'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'HTML/CSS Fondamentaux - Introduction', CURRENT_DATE, '09:00:00', '12:00:00', 'Salle A101', 'En cours'),
  ('att22222-2222-2222-2222-222222222222'::uuid, 'slot2222-2222-2222-2222-222222222222'::uuid, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'JavaScript ES6+ - Bases', CURRENT_DATE, '14:00:00', '17:00:00', 'Salle A102', 'En attente'),
  ('att33333-3333-3333-3333-333333333333'::uuid, 'slot3333-3333-3333-3333-333333333333'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'SEO et Analytics - Technique', CURRENT_DATE, '10:00:00', '13:00:00', 'Salle B201', 'En attente')
ON CONFLICT (id) DO NOTHING;

-- Ajouter quelques signatures pour simuler des présences
INSERT INTO public.attendance_signatures (attendance_sheet_id, user_id, user_type, present, signature_data) VALUES
  -- Signatures pour le premier cours (HTML/CSS)
  ('att11111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'instructor', true, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIj48cGF0aCBkPSJNMTAgNDBMMTkwIDQwIiBzdHJva2U9IiMwMDAiLz48L3N2Zz4='),
  ('att11111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'student', true, NULL),
  ('att11111-1111-1111-1111-111111111111'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'student', true, NULL),
  -- Une signature pour le cours de SEO
  ('att33333-3333-3333-3333-333333333333'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'instructor', true, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIj48cGF0aCBkPSJNMTAgNDBMMTkwIDQwIiBzdHJva2U9IiMwMDAiLz48L3N2Zz4=')
ON CONFLICT DO NOTHING;