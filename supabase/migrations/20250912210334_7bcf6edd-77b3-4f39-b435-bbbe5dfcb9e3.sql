-- Insérer des événements fictifs pour tester le système
INSERT INTO events (
  id,
  establishment_id,
  title,
  description,
  start_date,
  start_time,
  end_date,
  end_time,
  location,
  category,
  max_participants,
  image_url,
  status,
  created_by,
  created_at,
  updated_at
) VALUES
  -- Événement 1: Conférence sur l'IA
  (
    gen_random_uuid(),
    (SELECT id FROM establishments LIMIT 1),
    'Conférence : Intelligence Artificielle et Éducation',
    'Découvrez comment l''IA révolutionne le secteur éducatif avec nos experts. Session interactive avec démonstrations pratiques et échanges avec les participants.',
    '2025-01-15'::date,
    '14:00'::time,
    '2025-01-15'::date,
    '17:00'::time,
    'Amphithéâtre A',
    'Conférence',
    150,
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
    'Ouvert',
    (SELECT id FROM users WHERE role = 'Administrateur' LIMIT 1),
    now(),
    now()
  ),
  
  -- Événement 2: Atelier pratique
  (
    gen_random_uuid(),
    (SELECT id FROM establishments LIMIT 1),
    'Atelier Développement React avancé',
    'Atelier pratique de 4 heures sur React : hooks avancés, context API, optimisation des performances. Apportez votre laptop !',
    '2025-01-20'::date,
    '09:00'::time,
    '2025-01-20'::date,
    '13:00'::time,
    'Laboratoire Informatique B12',
    'Atelier',
    25,
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
    'Ouvert',
    (SELECT id FROM users WHERE role = 'Formateur' LIMIT 1),
    now(),
    now()
  ),

  -- Événement 3: Cérémonie de remise des diplômes
  (
    gen_random_uuid(),
    (SELECT id FROM establishments LIMIT 1),
    'Cérémonie de Remise des Diplômes 2025',
    'Cérémonie officielle de remise des diplômes pour la promotion 2025. Moment solennel en présence des familles et du corps enseignant.',
    '2025-02-10'::date,
    '15:00'::time,
    '2025-02-10'::date,
    '18:00'::time,
    'Grand Auditorium',
    'Cérémonie',
    300,
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    'Ouvert',
    (SELECT id FROM users WHERE role = 'Super Administrateur' LIMIT 1),
    now(),
    now()
  ),

  -- Événement 4: Networking
  (
    gen_random_uuid(),
    (SELECT id FROM establishments LIMIT 1),
    'Soirée Networking Alumni & Étudiants',
    'Rencontrez nos anciens diplômés ! Soirée décontractée pour échanger, créer des contacts professionnels et découvrir des opportunités de carrière.',
    '2025-01-25'::date,
    '18:30'::time,
    '2025-01-25'::date,
    '22:00'::time,
    'Espace Coworking - Hall Principal',
    'Networking',
    80,
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    'Bientôt complet',
    (SELECT id FROM users WHERE role = 'Administrateur' LIMIT 1),
    now(),
    now()
  ),

  -- Événement 5: Présentation projet
  (
    gen_random_uuid(),
    (SELECT id FROM establishments LIMIT 1),
    'Présentation des Projets de Fin d''Études',
    'Les étudiants de dernière année présentent leurs projets innovants. Jury composé d''experts du secteur et de professeurs.',
    '2025-02-05'::date,
    '10:00'::time,
    '2025-02-05'::date,
    '17:00'::time,
    'Salles de conférence C1-C4',
    'Présentation',
    120,
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
    'Ouvert',
    (SELECT id FROM users WHERE role = 'Formateur' LIMIT 1),
    now(),
    now()
  ),

  -- Événement 6: Formation spécialisée
  (
    gen_random_uuid(),
    (SELECT id FROM establishments LIMIT 1),
    'Formation : Cybersécurité et Éthique Numérique',
    'Formation intensive de 2 jours sur les enjeux de cybersécurité. Certification incluse pour les participants.',
    '2025-02-15'::date,
    '09:00'::time,
    '2025-02-16'::date,
    '17:00'::time,
    'Centre de Formation Continue',
    'Formation',
    30,
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    'Ouvert',
    (SELECT id FROM users WHERE role = 'Formateur' LIMIT 1),
    now(),
    now()
  ),

  -- Événement 7: Événement complet
  (
    gen_random_uuid(),
    (SELECT id FROM establishments LIMIT 1),
    'Hackathon 48h - Innovation Durable',
    'Hackathon de 48h sur le thème du développement durable. Équipes multidisciplinaires, mentoring et prix à gagner !',
    '2025-03-01'::date,
    '18:00'::time,
    '2025-03-03'::date,
    '18:00'::time,
    'FabLab & Espaces Collaboratifs',
    'Atelier',
    50,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    'Complet',
    (SELECT id FROM users WHERE role = 'Administrateur' LIMIT 1),
    now(),
    now()
  );

-- Ajouter quelques inscriptions fictives pour simuler l'activité
INSERT INTO event_registrations (
  id,
  event_id,
  user_id,
  status,
  registered_at
)
SELECT 
  gen_random_uuid(),
  e.id,
  u.id,
  'Confirmée',
  now() - interval '1 day' * (random() * 10)
FROM 
  events e,
  users u
WHERE 
  e.title LIKE '%Hackathon%' -- Pour l'événement complet
  AND u.role = 'Étudiant'
LIMIT 50;

-- Ajouter quelques inscriptions pour les autres événements
INSERT INTO event_registrations (
  id,
  event_id,
  user_id,
  status,
  registered_at
)
SELECT 
  gen_random_uuid(),
  e.id,
  u.id,
  'Confirmée',
  now() - interval '1 hour' * (random() * 24)
FROM 
  events e,
  users u
WHERE 
  e.title LIKE '%Networking%'
  AND u.role IN ('Étudiant', 'Formateur')
LIMIT 65; -- Pour simuler "bientôt complet"