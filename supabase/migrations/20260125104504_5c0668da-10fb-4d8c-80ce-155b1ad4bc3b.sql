-- NETTOYAGE COMPLET DE LA BASE DE DONNÉES
-- Suppression de toutes les données dans l'ordre correct (respect des FK)

-- 1. Tables enfants avec dépendances multiples
DELETE FROM attendance_signatures;
DELETE FROM attendance_audit_log;
DELETE FROM qr_validation_attempts;
DELETE FROM attendance_sheets;

DELETE FROM assignment_submissions;
DELETE FROM module_assignments;
DELETE FROM module_contents;
DELETE FROM module_documents;
DELETE FROM formation_modules;

DELETE FROM message_recipients;
DELETE FROM message_attachments;
DELETE FROM messages;

DELETE FROM chat_messages;
DELETE FROM chat_group_members;
DELETE FROM chat_groups;

DELETE FROM event_registrations;
DELETE FROM events;

DELETE FROM virtual_class_participants;
DELETE FROM virtual_classes;

DELETE FROM digital_safe_file_permissions;
DELETE FROM digital_safe_files;

DELETE FROM text_book_entries;
DELETE FROM text_books;

DELETE FROM schedule_slots;
DELETE FROM schedules;

DELETE FROM user_formation_assignments;
DELETE FROM tutor_student_assignments;
DELETE FROM user_signatures;

DELETE FROM notifications;
DELETE FROM invitations;
DELETE FROM user_activation_tokens;

-- 2. Tables principales
DELETE FROM tutors;
DELETE FROM users;
DELETE FROM formations;
DELETE FROM establishments;

-- 3. Tables système
DELETE FROM establishment_creation_attempts;

-- Note: Les comptes auth.users doivent être supprimés manuellement via le dashboard Supabase