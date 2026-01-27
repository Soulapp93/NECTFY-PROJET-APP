
-- Ajouter une politique RLS pour que les tuteurs puissent voir les feuilles d'émargement de leurs apprentis
CREATE POLICY "Tutors view student sheets"
ON public.attendance_sheets
FOR SELECT
USING (
  formation_id IN (
    SELECT ufa.formation_id 
    FROM user_formation_assignments ufa
    WHERE ufa.user_id IN (
      SELECT tsa.student_id 
      FROM tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() 
        AND tsa.is_active = true
    )
  )
);

-- Ajouter une politique pour que les tuteurs puissent voir les signatures de leurs apprentis
CREATE POLICY "Tutors view student signatures"
ON public.attendance_signatures
FOR SELECT
USING (
  attendance_sheet_id IN (
    SELECT ash.id
    FROM attendance_sheets ash
    WHERE ash.formation_id IN (
      SELECT ufa.formation_id 
      FROM user_formation_assignments ufa
      WHERE ufa.user_id IN (
        SELECT tsa.student_id 
        FROM tutor_student_assignments tsa
        WHERE tsa.tutor_id = auth.uid() 
          AND tsa.is_active = true
      )
    )
  )
);
