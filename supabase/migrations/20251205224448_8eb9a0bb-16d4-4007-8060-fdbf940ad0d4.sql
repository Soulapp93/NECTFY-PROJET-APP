-- Fix RLS policies for schedules table to filter by establishment
DROP POLICY IF EXISTS "Admins manage schedules" ON schedules;
CREATE POLICY "Admins manage schedules" ON schedules
FOR ALL
USING (
  (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
  AND (formation_id IN (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment()))
);

-- Fix RLS policies for text_books table to filter by establishment
DROP POLICY IF EXISTS "Admins manage textbooks" ON text_books;
CREATE POLICY "Admins manage textbooks" ON text_books
FOR ALL
USING (
  (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
  AND (formation_id IN (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment()))
);

-- Fix RLS policies for schedule_slots table
DROP POLICY IF EXISTS "Admins manage slots" ON schedule_slots;
CREATE POLICY "Admins manage slots" ON schedule_slots
FOR ALL
USING (
  (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
  AND (schedule_id IN (
    SELECT s.id FROM schedules s 
    JOIN formations f ON s.formation_id = f.id 
    WHERE f.establishment_id = get_current_user_establishment()
  ))
);

-- Fix RLS policies for text_book_entries table
DROP POLICY IF EXISTS "Instructors manage entries" ON text_book_entries;
CREATE POLICY "Instructors manage entries" ON text_book_entries
FOR ALL
USING (
  (get_current_user_role() = ANY (ARRAY['Formateur'::text, 'Admin'::text, 'AdminPrincipal'::text]))
  AND (text_book_id IN (
    SELECT tb.id FROM text_books tb 
    JOIN formations f ON tb.formation_id = f.id 
    WHERE f.establishment_id = get_current_user_establishment()
  ))
);

-- Fix RLS policies for attendance_sheets table
DROP POLICY IF EXISTS "Admins manage sheets" ON attendance_sheets;
CREATE POLICY "Admins manage sheets" ON attendance_sheets
FOR ALL
USING (
  (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
  AND (formation_id IN (SELECT id FROM formations WHERE establishment_id = get_current_user_establishment()))
);

-- Fix RLS policies for users table to ensure establishment isolation
DROP POLICY IF EXISTS "View establishment users" ON users;
CREATE POLICY "View establishment users" ON users
FOR SELECT
USING (establishment_id = get_current_user_establishment());

-- Fix RLS policies for tutors table
DROP POLICY IF EXISTS "View establishment tutors" ON tutors;
CREATE POLICY "View establishment tutors" ON tutors
FOR SELECT
USING (establishment_id = get_current_user_establishment());

DROP POLICY IF EXISTS "Admins manage tutors" ON tutors;
CREATE POLICY "Admins manage tutors" ON tutors
FOR ALL
USING (
  (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
  AND (establishment_id = get_current_user_establishment())
);