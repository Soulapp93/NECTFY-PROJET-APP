-- ============================================
-- MIGRATION RLS PRODUCTION - SUPPRESSION ET RECRÉATION
-- ============================================

-- Supprimer TOUTES les politiques existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 1. USERS - Données personnelles
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view users in establishment"
ON users FOR SELECT
TO authenticated
USING (
  get_current_user_establishment() = establishment_id
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  get_current_user_establishment() = establishment_id
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

CREATE POLICY "Public can create first admin"
ON users FOR INSERT
TO anon, authenticated
WITH CHECK (role = 'Admin');

CREATE POLICY "Users update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins update users"
ON users FOR UPDATE
TO authenticated
USING (
  get_current_user_establishment() = establishment_id
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

-- 2. TUTORS
CREATE POLICY "Admins view tutors"
ON tutors FOR SELECT
TO authenticated
USING (
  get_current_user_establishment() = establishment_id
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

CREATE POLICY "Admins manage tutors"
ON tutors FOR ALL
TO authenticated
USING (
  get_current_user_establishment() = establishment_id
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

-- 3. USER_SIGNATURES
CREATE POLICY "View own signature"
ON user_signatures FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Create own signature"
ON user_signatures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own signature"
ON user_signatures FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view signatures"
ON user_signatures FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

-- 4. ATTENDANCE_SIGNATURES
CREATE POLICY "View own attendance signatures"
ON attendance_signatures FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Create attendance signatures"
ON attendance_signatures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Instructors view session signatures"
ON attendance_signatures FOR SELECT
TO authenticated
USING (
  attendance_sheet_id IN (
    SELECT id FROM attendance_sheets WHERE instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins view all signatures"
ON attendance_signatures FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

CREATE POLICY "Admins manage signatures"
ON attendance_signatures FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

-- 5. ASSIGNMENT_CORRECTIONS
CREATE POLICY "View own corrections"
ON assignment_corrections FOR SELECT
TO authenticated
USING (
  submission_id IN (
    SELECT id FROM assignment_submissions WHERE student_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage corrections"
ON assignment_corrections FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

-- 6. ASSIGNMENT_SUBMISSIONS
CREATE POLICY "View own submissions"
ON assignment_submissions FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Create own submissions"
ON assignment_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Update own submissions"
ON assignment_submissions FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Instructors view submissions"
ON assignment_submissions FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

-- 7. CHAT_MESSAGES
CREATE POLICY "View group messages"
ON chat_messages FOR SELECT
TO authenticated
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Create group messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (is_group_member(auth.uid(), group_id) AND auth.uid() = sender_id);

CREATE POLICY "Update own messages"
ON chat_messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Delete own messages"
ON chat_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- 8. CHAT_MESSAGE_ATTACHMENTS
CREATE POLICY "View group attachments"
ON chat_message_attachments FOR SELECT
TO authenticated
USING (
  message_id IN (
    SELECT id FROM chat_messages WHERE is_group_member(auth.uid(), group_id)
  )
);

CREATE POLICY "Create message attachments"
ON chat_message_attachments FOR INSERT
TO authenticated
WITH CHECK (
  message_id IN (SELECT id FROM chat_messages WHERE sender_id = auth.uid())
);

-- 9. ATTENDANCE_SHEETS
CREATE POLICY "View formation sheets"
ON attendance_sheets FOR SELECT
TO authenticated
USING (
  formation_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Instructors view own sheets"
ON attendance_sheets FOR SELECT
TO authenticated
USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors create sheets"
ON attendance_sheets FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = instructor_id
  AND get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal')
);

CREATE POLICY "Instructors update sheets"
ON attendance_sheets FOR UPDATE
TO authenticated
USING (auth.uid() = instructor_id);

CREATE POLICY "Admins manage sheets"
ON attendance_sheets FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

-- 10. ESTABLISHMENTS
CREATE POLICY "View own establishment"
ON establishments FOR SELECT
TO authenticated
USING (id = get_current_user_establishment());

CREATE POLICY "Admins update establishment"
ON establishments FOR UPDATE
TO authenticated
USING (
  id = get_current_user_establishment()
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

CREATE POLICY "Public create establishments"
ON establishments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 11. FORMATIONS
CREATE POLICY "View establishment formations"
ON formations FOR SELECT
TO authenticated
USING (establishment_id = get_current_user_establishment());

CREATE POLICY "Admins manage formations"
ON formations FOR ALL
TO authenticated
USING (
  establishment_id = get_current_user_establishment()
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

-- 12. MODULE_CONTENTS
CREATE POLICY "View enrolled contents"
ON module_contents FOR SELECT
TO authenticated
USING (
  module_id IN (
    SELECT fm.id FROM formation_modules fm
    JOIN user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage contents"
ON module_contents FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

-- 13. SCHEDULE_SLOTS
CREATE POLICY "View formation slots"
ON schedule_slots FOR SELECT
TO authenticated
USING (
  schedule_id IN (
    SELECT s.id FROM schedules s
    JOIN user_formation_assignments ufa ON ufa.formation_id = s.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors view assigned slots"
ON schedule_slots FOR SELECT
TO authenticated
USING (auth.uid() = instructor_id);

CREATE POLICY "Admins manage slots"
ON schedule_slots FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

-- 14. TEXT_BOOK_ENTRIES
CREATE POLICY "View formation entries"
ON text_book_entries FOR SELECT
TO authenticated
USING (
  text_book_id IN (
    SELECT tb.id FROM text_books tb
    JOIN user_formation_assignments ufa ON ufa.formation_id = tb.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage entries"
ON text_book_entries FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

-- 15. VIRTUAL_CLASSES
CREATE POLICY "View formation classes"
ON virtual_classes FOR SELECT
TO authenticated
USING (
  formation_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage classes"
ON virtual_classes FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

-- 16. CHAT_GROUPS
CREATE POLICY "View member groups"
ON chat_groups FOR SELECT
TO authenticated
USING (is_group_member(auth.uid(), id));

CREATE POLICY "Admins manage groups"
ON chat_groups FOR ALL
TO authenticated
USING (
  establishment_id = get_current_user_establishment()
  AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
);

-- 17. CHAT_GROUP_MEMBERS
CREATE POLICY "View group members"
ON chat_group_members FOR SELECT
TO authenticated
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Admins manage members"
ON chat_group_members FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

-- 18. TABLES SUPPORT
CREATE POLICY "View assignment files"
ON assignment_files FOR SELECT
TO authenticated
USING (
  assignment_id IN (
    SELECT ma.id FROM module_assignments ma
    JOIN formation_modules fm ON fm.id = ma.module_id
    JOIN user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage files"
ON assignment_files FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

CREATE POLICY "View own submission files"
ON submission_files FOR ALL
TO authenticated
USING (
  submission_id IN (SELECT id FROM assignment_submissions WHERE student_id = auth.uid())
);

CREATE POLICY "Instructors view files"
ON submission_files FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

CREATE POLICY "View formation modules"
ON formation_modules FOR SELECT
TO authenticated
USING (
  formation_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage modules"
ON formation_modules FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

CREATE POLICY "View module assignments"
ON module_assignments FOR SELECT
TO authenticated
USING (
  module_id IN (
    SELECT fm.id FROM formation_modules fm
    JOIN user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage assignments"
ON module_assignments FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

CREATE POLICY "View module documents"
ON module_documents FOR SELECT
TO authenticated
USING (
  module_id IN (
    SELECT fm.id FROM formation_modules fm
    JOIN user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage documents"
ON module_documents FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

CREATE POLICY "View module instructors"
ON module_instructors FOR SELECT
TO authenticated
USING (
  module_id IN (
    SELECT fm.id FROM formation_modules fm
    JOIN user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage instructors"
ON module_instructors FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

CREATE POLICY "View formation schedules"
ON schedules FOR SELECT
TO authenticated
USING (
  formation_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage schedules"
ON schedules FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

CREATE POLICY "View own assignments"
ON user_formation_assignments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage assignments"
ON user_formation_assignments FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

CREATE POLICY "View formation textbooks"
ON text_books FOR SELECT
TO authenticated
USING (
  formation_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage textbooks"
ON text_books FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

CREATE POLICY "View entry files"
ON text_book_entry_files FOR SELECT
TO authenticated
USING (
  text_book_entry_id IN (
    SELECT tbe.id FROM text_book_entries tbe
    JOIN text_books tb ON tb.id = tbe.text_book_id
    JOIN user_formation_assignments ufa ON ufa.formation_id = tb.formation_id
    WHERE ufa.user_id = auth.uid()
  )
);

CREATE POLICY "Instructors manage entry files"
ON text_book_entry_files FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

CREATE POLICY "View own formations"
ON student_formations FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Admins manage student formations"
ON student_formations FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

-- Conserver policies existantes pour tables audit/notif
CREATE POLICY "Admins view audit logs"
ON attendance_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'::user_role)
);

CREATE POLICY "System insert audit logs"
ON attendance_audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "System create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users view attempts"
ON qr_validation_attempts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System insert attempts"
ON qr_validation_attempts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins manage tutor assignments"
ON tutor_student_assignments FOR ALL
TO authenticated
USING (get_current_user_role() = 'Admin');

CREATE POLICY "Tutors view student assignments"
ON tutor_student_assignments FOR SELECT
TO authenticated
USING ((auth.uid())::text = (tutor_id)::text);

CREATE POLICY "Users view activation tokens"
ON user_activation_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Event creators view registrations"
ON event_registrations FOR SELECT
TO authenticated
USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Users manage own registrations"
ON event_registrations FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users view establishment events"
ON events FOR SELECT
TO authenticated
USING (establishment_id = get_current_user_establishment());

CREATE POLICY "Users create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id = get_current_user_establishment()
  AND auth.uid() = created_by
);

CREATE POLICY "Creators update events"
ON events FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Admins update events"
ON events FOR UPDATE
TO authenticated
USING (
  establishment_id = get_current_user_establishment()
  AND get_current_user_role() IN ('Administrateur', 'Super Administrateur')
);

CREATE POLICY "Senders view messages"
ON messages FOR SELECT
TO authenticated
USING (
  (sender_id = auth.uid()) OR
  (id IN (
    SELECT message_id FROM message_recipients
    WHERE (
      (recipient_type = 'user' AND recipient_id = auth.uid()) OR
      (recipient_type = 'formation' AND recipient_id IN (
        SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
      )) OR
      (recipient_type = 'all_instructors' AND auth.uid() IN (
        SELECT id FROM users WHERE role = 'Formateur'::user_role
      ))
    )
  ))
);

CREATE POLICY "Users create messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users update messages"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Users view message recipients"
ON message_recipients FOR SELECT
TO authenticated
USING (
  (message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())) OR
  (recipient_type = 'user' AND recipient_id = auth.uid()) OR
  (recipient_type = 'formation' AND recipient_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )) OR
  (recipient_type = 'all_instructors' AND auth.uid() IN (
    SELECT id FROM users WHERE role = 'Formateur'::user_role
  ))
);

CREATE POLICY "Users create recipients"
ON message_recipients FOR INSERT
TO authenticated
WITH CHECK (message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid()));

CREATE POLICY "Users update recipients"
ON message_recipients FOR UPDATE
TO authenticated
USING (
  (recipient_type = 'user' AND recipient_id = auth.uid()) OR
  (recipient_type = 'formation' AND recipient_id IN (
    SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
  )) OR
  (recipient_type = 'all_instructors' AND auth.uid() IN (
    SELECT id FROM users WHERE role = 'Formateur'::user_role
  ))
);

CREATE POLICY "Users view accessible attachments"
ON message_attachments FOR SELECT
TO authenticated
USING (
  (message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid())) OR
  (message_id IN (
    SELECT mr.message_id FROM message_recipients mr
    WHERE (
      (mr.recipient_type = 'user' AND mr.recipient_id = auth.uid()) OR
      (mr.recipient_type = 'formation' AND mr.recipient_id IN (
        SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
      )) OR
      (mr.recipient_type = 'all_instructors' AND auth.uid() IN (
        SELECT id FROM users WHERE role = 'Formateur'::user_role
      ))
    )
  ))
);

CREATE POLICY "Users create attachments"
ON message_attachments FOR INSERT
TO authenticated
WITH CHECK (message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid()));

CREATE POLICY "Owners view file permissions"
ON digital_safe_file_permissions FOR SELECT
TO authenticated
USING (
  (file_id IN (SELECT id FROM digital_safe_files WHERE user_id = auth.uid())) OR
  (user_id = auth.uid())
);

CREATE POLICY "Owners grant permissions"
ON digital_safe_file_permissions FOR INSERT
TO authenticated
WITH CHECK (file_id IN (SELECT id FROM digital_safe_files WHERE user_id = auth.uid()));

CREATE POLICY "Users view accessible files"
ON digital_safe_files FOR SELECT
TO authenticated
USING (can_access_file(id, auth.uid()));

CREATE POLICY "Users manage own files"
ON digital_safe_files FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users manage folders"
ON digital_safe_folders FOR ALL
TO authenticated
USING (
  (user_id = auth.uid()) OR
  (establishment_id = get_current_user_establishment())
);

CREATE POLICY "Students view class materials"
ON virtual_class_materials FOR SELECT
TO authenticated
USING (
  virtual_class_id IN (
    SELECT id FROM virtual_classes
    WHERE formation_id IN (
      SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Instructors manage materials"
ON virtual_class_materials FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));

CREATE POLICY "Students view class participants"
ON virtual_class_participants FOR SELECT
TO authenticated
USING (
  virtual_class_id IN (
    SELECT id FROM virtual_classes
    WHERE formation_id IN (
      SELECT formation_id FROM user_formation_assignments WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users manage own participation"
ON virtual_class_participants FOR ALL
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Instructors manage participants"
ON virtual_class_participants FOR ALL
TO authenticated
USING (get_current_user_role() IN ('Formateur', 'Admin', 'AdminPrincipal'));