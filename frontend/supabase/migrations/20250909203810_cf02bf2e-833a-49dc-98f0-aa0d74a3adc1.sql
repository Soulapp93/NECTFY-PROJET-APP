-- Insertion de feuilles d'émargement fictives en attente de validation pour tester la fonctionnalité

-- Feuilles pour la formation "Développement Web Full Stack"
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
-- Formation Développement Web Full Stack (3 feuilles en attente)
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement Web Full Stack - Session React Hooks', '2025-01-20', '09:00:00', '12:00:00', '22222222-2222-2222-2222-222222222222', 'Salle A201', 'En attente de validation', now(), now(), now(), false),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement Web Full Stack - API REST', '2025-01-22', '14:00:00', '17:00:00', '22222222-2222-2222-2222-222222222222', 'Salle B102', 'En attente de validation', now(), now(), now(), false),
(gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Développement Web Full Stack - Base de données', '2025-01-25', '10:00:00', '13:00:00', '22222222-2222-2222-2222-222222222222', 'Salle C301', 'En attente de validation', now(), now(), now(), false),

-- Formation Marketing Digital (2 feuilles en attente)
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Digital - Stratégies SEO', '2025-02-05', '09:00:00', '12:00:00', '22222222-2222-2222-2222-222222222222', 'Salle D205', 'En attente de validation', now(), now(), now(), false),
(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marketing Digital - Réseaux sociaux', '2025-02-07', '14:00:00', '16:30:00', '22222222-2222-2222-2222-222222222222', 'Salle E104', 'En attente de validation', now(), now(), now(), false),

-- Formation "la paie" (1 feuille en attente)
(gen_random_uuid(), 'd1a225ab-95d0-44a3-9304-fc779e49adcf', 'la paie - Calculs de salaire', '2025-01-18', '08:30:00', '11:30:00', '22222222-2222-2222-2222-222222222222', 'Salle F203', 'En attente de validation', now(), now(), now(), false);