-- Créer une feuille d'émargement de test avec signatures
DO $$
DECLARE
    test_formation_id uuid;
    test_instructor_id uuid;
    test_schedule_slot_id uuid;
    test_attendance_sheet_id uuid;
    test_student_id1 uuid;
    test_student_id2 uuid;
    test_student_id3 uuid;
BEGIN
    -- Récupérer une formation existante (ou créer une formation de test)
    SELECT id INTO test_formation_id FROM formations LIMIT 1;
    
    -- Si pas de formation, créer une formation de test
    IF test_formation_id IS NULL THEN
        INSERT INTO formations (
            id, establishment_id, title, description, level, duration, 
            max_students, start_date, end_date, status
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM establishments LIMIT 1),
            'Formation Test Émargement',
            'Formation de test pour l''émargement',
            'Débutant',
            40,
            20,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            'Actif'
        ) RETURNING id INTO test_formation_id;
    END IF;
    
    -- Récupérer un formateur existant
    SELECT id INTO test_instructor_id FROM users WHERE role = 'Formateur' LIMIT 1;
    
    -- Si pas de formateur, créer un formateur de test
    IF test_instructor_id IS NULL THEN
        INSERT INTO users (
            id, establishment_id, first_name, last_name, email, role, status, is_activated
        ) VALUES (
            gen_random_uuid(),
            (SELECT establishment_id FROM formations WHERE id = test_formation_id),
            'Jean',
            'Formateur',
            'jean.formateur@test.com',
            'Formateur',
            'Actif',
            true
        ) RETURNING id INTO test_instructor_id;
    END IF;
    
    -- Créer des étudiants de test
    INSERT INTO users (
        id, establishment_id, first_name, last_name, email, role, status, is_activated
    ) VALUES 
    (
        gen_random_uuid(),
        (SELECT establishment_id FROM formations WHERE id = test_formation_id),
        'Marie',
        'Dupont',
        'marie.dupont@test.com',
        'Étudiant',
        'Actif',
        true
    ),
    (
        gen_random_uuid(),
        (SELECT establishment_id FROM formations WHERE id = test_formation_id),
        'Pierre',
        'Martin',
        'pierre.martin@test.com',
        'Étudiant',
        'Actif',
        true
    ),
    (
        gen_random_uuid(),
        (SELECT establishment_id FROM formations WHERE id = test_formation_id),
        'Sophie',
        'Bernard',
        'sophie.bernard@test.com',
        'Étudiant',
        'Actif',
        true
    );
    
    -- Récupérer les IDs des étudiants créés
    SELECT id INTO test_student_id1 FROM users WHERE email = 'marie.dupont@test.com';
    SELECT id INTO test_student_id2 FROM users WHERE email = 'pierre.martin@test.com';
    SELECT id INTO test_student_id3 FROM users WHERE email = 'sophie.bernard@test.com';
    
    -- Inscrire les étudiants à la formation
    INSERT INTO user_formation_assignments (user_id, formation_id) VALUES
    (test_student_id1, test_formation_id),
    (test_student_id2, test_formation_id),
    (test_student_id3, test_formation_id);
    
    -- Créer un module pour la formation
    INSERT INTO formation_modules (
        formation_id, title, description, duration_hours, order_index
    ) VALUES (
        test_formation_id,
        'Module Test Émargement',
        'Module de test pour l''émargement',
        8,
        1
    );
    
    -- Créer un planning (schedule) pour la formation
    INSERT INTO schedules (
        id, formation_id, title, academic_year, status, created_by
    ) VALUES (
        gen_random_uuid(),
        test_formation_id,
        'Planning Test',
        '2025-2026',
        'Publié',
        test_instructor_id
    );
    
    -- Créer un créneau (schedule_slot) pour aujourd'hui
    INSERT INTO schedule_slots (
        id, schedule_id, module_id, instructor_id, date, start_time, end_time, room
    ) VALUES (
        gen_random_uuid(),
        (SELECT id FROM schedules WHERE formation_id = test_formation_id LIMIT 1),
        (SELECT id FROM formation_modules WHERE formation_id = test_formation_id LIMIT 1),
        test_instructor_id,
        CURRENT_DATE,
        '09:00:00',
        '12:00:00',
        'Salle 101'
    ) RETURNING id INTO test_schedule_slot_id;
    
    -- Créer la feuille d'émargement
    INSERT INTO attendance_sheets (
        id, schedule_slot_id, formation_id, date, start_time, end_time, 
        instructor_id, title, room, status, is_open_for_signing, qr_code,
        opened_at
    ) VALUES (
        gen_random_uuid(),
        test_schedule_slot_id,
        test_formation_id,
        CURRENT_DATE,
        '09:00:00',
        '12:00:00',
        test_instructor_id,
        'Émargement Test - Module Test',
        'Salle 101',
        'En cours',
        true,
        '123456',
        NOW() - INTERVAL '1 hour'
    ) RETURNING id INTO test_attendance_sheet_id;
    
    -- Ajouter les signatures des étudiants (tous présents)
    INSERT INTO attendance_signatures (
        attendance_sheet_id, user_id, user_type, present, signed_at, signature_data
    ) VALUES 
    (
        test_attendance_sheet_id,
        test_student_id1,
        'student',
        true,
        NOW() - INTERVAL '45 minutes',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    ),
    (
        test_attendance_sheet_id,
        test_student_id2,
        'student',
        true,
        NOW() - INTERVAL '40 minutes',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    ),
    (
        test_attendance_sheet_id,
        test_student_id3,
        'student',
        true,
        NOW() - INTERVAL '35 minutes',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    );
    
    -- Ajouter la signature du formateur
    INSERT INTO attendance_signatures (
        attendance_sheet_id, user_id, user_type, present, signed_at, signature_data
    ) VALUES (
        test_attendance_sheet_id,
        test_instructor_id,
        'instructor',
        true,
        NOW() - INTERVAL '30 minutes',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    );
    
    RAISE NOTICE 'Feuille d''émargement de test créée avec l''ID: %', test_attendance_sheet_id;
    RAISE NOTICE 'Formation: %', test_formation_id;
    RAISE NOTICE 'Formateur: %', test_instructor_id;
    
END $$;