-- Autoriser les tuteurs à consulter les données pédagogiques de leurs apprentis
-- (contenus, documents, devoirs, soumissions, corrections, fichiers)

-- MODULE CONTENTS
CREATE POLICY "Tutors view student module contents"
ON public.module_contents
FOR SELECT
USING (
  get_current_user_role() = 'Tuteur'
  AND module_id IN (
    SELECT fm.id
    FROM public.formation_modules fm
    JOIN public.user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);

-- MODULE DOCUMENTS
CREATE POLICY "Tutors view student module documents"
ON public.module_documents
FOR SELECT
USING (
  get_current_user_role() = 'Tuteur'
  AND module_id IN (
    SELECT fm.id
    FROM public.formation_modules fm
    JOIN public.user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);

-- MODULE ASSIGNMENTS
CREATE POLICY "Tutors view student module assignments"
ON public.module_assignments
FOR SELECT
USING (
  get_current_user_role() = 'Tuteur'
  AND module_id IN (
    SELECT fm.id
    FROM public.formation_modules fm
    JOIN public.user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);

-- ASSIGNMENT FILES (pièces jointes d'un devoir)
CREATE POLICY "Tutors view student assignment files"
ON public.assignment_files
FOR SELECT
USING (
  get_current_user_role() = 'Tuteur'
  AND assignment_id IN (
    SELECT ma.id
    FROM public.module_assignments ma
    JOIN public.formation_modules fm ON fm.id = ma.module_id
    JOIN public.user_formation_assignments ufa ON ufa.formation_id = fm.formation_id
    WHERE ufa.user_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);

-- ASSIGNMENT SUBMISSIONS (rendus)
CREATE POLICY "Tutors view student submissions"
ON public.assignment_submissions
FOR SELECT
USING (
  get_current_user_role() = 'Tuteur'
  AND student_id IN (
    SELECT tsa.student_id
    FROM public.tutor_student_assignments tsa
    WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
  )
);

-- SUBMISSION FILES (fichiers envoyés par l'étudiant)
CREATE POLICY "Tutors view student submission files"
ON public.submission_files
FOR SELECT
USING (
  get_current_user_role() = 'Tuteur'
  AND submission_id IN (
    SELECT s.id
    FROM public.assignment_submissions s
    WHERE s.student_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);

-- ASSIGNMENT CORRECTIONS
CREATE POLICY "Tutors view student corrections"
ON public.assignment_corrections
FOR SELECT
USING (
  get_current_user_role() = 'Tuteur'
  AND submission_id IN (
    SELECT s.id
    FROM public.assignment_submissions s
    WHERE s.student_id IN (
      SELECT tsa.student_id
      FROM public.tutor_student_assignments tsa
      WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
    )
  )
);
