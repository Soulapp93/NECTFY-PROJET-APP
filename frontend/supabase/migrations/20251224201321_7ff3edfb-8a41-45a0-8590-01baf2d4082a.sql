-- Ajouter une policy pour permettre aux tuteurs de voir les schedule_slots de leurs apprentis
CREATE POLICY "Tutors view student slots" ON public.schedule_slots
FOR SELECT
USING (
  schedule_id IN (
    SELECT s.id FROM schedules s
    JOIN user_formation_assignments ufa ON ufa.formation_id = s.formation_id
    WHERE ufa.user_id IN (
      SELECT student_id FROM tutor_student_assignments
      WHERE tutor_id = auth.uid() AND is_active = true
    )
  )
);

-- Ajouter une policy pour permettre aux tuteurs de voir les schedules de leurs apprentis
CREATE POLICY "Tutors view student schedules" ON public.schedules
FOR SELECT
USING (
  formation_id IN (
    SELECT formation_id FROM user_formation_assignments
    WHERE user_id IN (
      SELECT student_id FROM tutor_student_assignments
      WHERE tutor_id = auth.uid() AND is_active = true
    )
  )
);

-- Ajouter une policy pour permettre aux tuteurs de voir les attendance_sheets de leurs apprentis
CREATE POLICY "Tutors view student attendance sheets" ON public.attendance_sheets
FOR SELECT
USING (
  formation_id IN (
    SELECT formation_id FROM user_formation_assignments
    WHERE user_id IN (
      SELECT student_id FROM tutor_student_assignments
      WHERE tutor_id = auth.uid() AND is_active = true
    )
  )
);

-- Ajouter une policy pour permettre aux tuteurs de voir les formations de leurs apprentis
CREATE POLICY "Tutors view student formations" ON public.formations
FOR SELECT
USING (
  id IN (
    SELECT formation_id FROM user_formation_assignments
    WHERE user_id IN (
      SELECT student_id FROM tutor_student_assignments
      WHERE tutor_id = auth.uid() AND is_active = true
    )
  )
);