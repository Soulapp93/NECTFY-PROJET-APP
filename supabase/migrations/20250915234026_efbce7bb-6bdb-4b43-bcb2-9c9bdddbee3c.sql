-- Créer une feuille d'émargement démo avec 10 étudiants (corrigé)
DO $$
DECLARE
    demo_formation_id uuid;
    demo_instructor_id uuid;
    demo_schedule_slot_id uuid;
    demo_attendance_sheet_id uuid;
    student_ids uuid[];
    i integer;
    student_names text[][] := ARRAY[
        ARRAY['Alice', 'Durand'],
        ARRAY['Bob', 'Moreau'],
        ARRAY['Claire', 'Petit'],
        ARRAY['David', 'Rousseau'],
        ARRAY['Emma', 'Simon'],
        ARRAY['Fabien', 'Laurent'],
        ARRAY['Gabrielle', 'Michel'],
        ARRAY['Hugo', 'Leroy'],
        ARRAY['Isabelle', 'Garnier'],
        ARRAY['Julien', 'Faure']
    ];
BEGIN
    -- Récupérer ou créer une formation de démo
    SELECT id INTO demo_formation_id FROM formations WHERE title = 'Formation Démo Émargement';
    
    IF demo_formation_id IS NULL THEN
        INSERT INTO formations (
            id, establishment_id, title, description, level, duration, 
            max_students, start_date, end_date, status, color
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM establishments LIMIT 1),
            'Formation Démo Émargement',
            'Formation de démonstration pour tester le système d''émargement complet',
            'Intermédiaire',
            50,
            25,
            CURRENT_DATE - INTERVAL '5 days',
            CURRENT_DATE + INTERVAL '25 days',
            'Actif',
            '#10B981'
        ) RETURNING id INTO demo_formation_id;
    END IF;
    
    -- Récupérer ou créer un formateur de démo
    SELECT id INTO demo_instructor_id FROM users WHERE email = 'prof.demo@test.com';
    
    IF demo_instructor_id IS NULL THEN
        INSERT INTO users (
            id, establishment_id, first_name, last_name, email, role, status, is_activated
        ) VALUES (
            gen_random_uuid(),
            (SELECT establishment_id FROM formations WHERE id = demo_formation_id),
            'Professeur',
            'Démo',
            'prof.demo@test.com',
            'Formateur',
            'Actif',
            true
        ) RETURNING id INTO demo_instructor_id;
    END IF;
    
    -- Supprimer les anciens étudiants de démo s'ils existent
    DELETE FROM users WHERE email LIKE '%demo.student%@test.com';
    
    -- Créer 10 étudiants de démo
    FOR i IN 1..10 LOOP
        INSERT INTO users (
            id, establishment_id, first_name, last_name, email, role, status, is_activated
        ) VALUES (
            gen_random_uuid(),
            (SELECT establishment_id FROM formations WHERE id = demo_formation_id),
            student_names[i][1],
            student_names[i][2],
            'demo.student' || i || '@test.com',
            'Étudiant',
            'Actif',
            true
        );
        
        -- Stocker l'ID de l'étudiant
        student_ids := array_append(student_ids, (SELECT id FROM users WHERE email = 'demo.student' || i || '@test.com'));
        
        -- Inscrire l'étudiant à la formation
        INSERT INTO user_formation_assignments (user_id, formation_id) 
        VALUES (student_ids[i], demo_formation_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Créer un module pour la formation si nécessaire
    INSERT INTO formation_modules (
        formation_id, title, description, duration_hours, order_index
    ) VALUES (
        demo_formation_id,
        'Module Démo - Gestion de Projet',
        'Module de démonstration pour la gestion de projet',
        8,
        1
    ) ON CONFLICT DO NOTHING;
    
    -- Créer un planning pour la formation si nécessaire
    INSERT INTO schedules (
        id, formation_id, title, academic_year, status, created_by
    ) SELECT 
        gen_random_uuid(),
        demo_formation_id,
        'Planning Démo 2025',
        '2025-2026',
        'Publié',
        demo_instructor_id
    WHERE NOT EXISTS (
        SELECT 1 FROM schedules WHERE formation_id = demo_formation_id
    );
    
    -- Créer un créneau pour aujourd'hui
    INSERT INTO schedule_slots (
        id, schedule_id, module_id, instructor_id, date, start_time, end_time, room, color
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM schedules WHERE formation_id = demo_formation_id LIMIT 1),
        (SELECT id FROM formation_modules WHERE formation_id = demo_formation_id LIMIT 1),
        demo_instructor_id,
        CURRENT_DATE,
        '14:00:00',
        '17:00:00',
        'Salle Démo 202',
        '#10B981'
    ) RETURNING id INTO demo_schedule_slot_id;
    
    -- Créer la feuille d'émargement
    INSERT INTO attendance_sheets (
        id, schedule_slot_id, formation_id, date, start_time, end_time, 
        instructor_id, title, room, status, is_open_for_signing, qr_code,
        opened_at
    ) VALUES (
        gen_random_uuid(),
        demo_schedule_slot_id,
        demo_formation_id,
        CURRENT_DATE,
        '14:00:00',
        '17:00:00',
        demo_instructor_id,
        'Émargement Démo - Gestion de Projet',
        'Salle Démo 202',
        'En cours',
        true,
        'DEMO01',
        NOW() - INTERVAL '2 hours'
    ) RETURNING id INTO demo_attendance_sheet_id;
    
    -- Ajouter les signatures pour les 7 premiers étudiants (présents)
    FOR i IN 1..7 LOOP
        INSERT INTO attendance_signatures (
            attendance_sheet_id, user_id, user_type, present, signed_at, signature_data
        ) VALUES (
            demo_attendance_sheet_id,
            student_ids[i],
            'student',
            true,
            NOW() - INTERVAL '90 minutes' + (i * INTERVAL '5 minutes'),
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        );
    END LOOP;
    
    -- Marquer les 3 derniers étudiants comme absents (sans raison d'absence pour éviter les contraintes)
    FOR i IN 8..10 LOOP
        INSERT INTO attendance_signatures (
            attendance_sheet_id, user_id, user_type, present, signed_at
        ) VALUES (
            demo_attendance_sheet_id,
            student_ids[i],
            'student',
            false,
            NOW() - INTERVAL '60 minutes'
        );
    END LOOP;
    
    RAISE NOTICE 'Feuille d''émargement démo créée avec l''ID: %', demo_attendance_sheet_id;
    RAISE NOTICE 'Formation: % (ID: %)', 'Formation Démo Émargement', demo_formation_id;
    RAISE NOTICE 'QR Code: DEMO01';
    RAISE NOTICE '7 étudiants présents, 3 absents créés';
    
END $$;