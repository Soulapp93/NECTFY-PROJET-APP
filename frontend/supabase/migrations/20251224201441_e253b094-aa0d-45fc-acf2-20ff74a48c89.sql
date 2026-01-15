-- Ajouter une policy pour permettre aux tuteurs de voir les signatures d'émargement de leurs apprentis
CREATE POLICY "Tutors view student attendance signatures" ON public.attendance_signatures
FOR SELECT
USING (
  user_id IN (
    SELECT student_id FROM tutor_student_assignments
    WHERE tutor_id = auth.uid() AND is_active = true
  )
);

-- Ajouter une policy pour permettre aux tuteurs de voir les user_formation_assignments de leurs apprentis
CREATE POLICY "Tutors view student formation assignments" ON public.user_formation_assignments
FOR SELECT
USING (
  user_id IN (
    SELECT student_id FROM tutor_student_assignments
    WHERE tutor_id = auth.uid() AND is_active = true
  )
);