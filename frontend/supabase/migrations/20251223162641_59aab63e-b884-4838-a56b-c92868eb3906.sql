
-- Politiques pour tutors - voir ses propres infos
CREATE POLICY "Tutors view own info" 
ON public.tutors 
FOR SELECT 
USING (id = auth.uid());

-- Tuteurs peuvent mettre à jour leurs propres infos
CREATE POLICY "Tutors update own info" 
ON public.tutors 
FOR UPDATE 
USING (id = auth.uid());

-- Étudiants peuvent voir leur tuteur
CREATE POLICY "Students view their tutor" 
ON public.tutors 
FOR SELECT 
USING (
  id IN (
    SELECT tsa.tutor_id 
    FROM public.tutor_student_assignments tsa 
    WHERE tsa.student_id = auth.uid() 
      AND tsa.is_active = true
  )
);
