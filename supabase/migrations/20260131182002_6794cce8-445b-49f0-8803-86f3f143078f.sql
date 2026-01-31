-- Table pour l'association des formateurs aux modules
CREATE TABLE public.module_instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.formation_modules(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_id, instructor_id)
);

-- Index pour améliorer les performances
CREATE INDEX idx_module_instructors_module_id ON public.module_instructors(module_id);
CREATE INDEX idx_module_instructors_instructor_id ON public.module_instructors(instructor_id);

-- Enable RLS
ALTER TABLE public.module_instructors ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins peuvent tout gérer
CREATE POLICY "Admins manage module instructors"
  ON public.module_instructors
  FOR ALL
  USING (public.is_current_user_admin());

-- Politique: Les formateurs peuvent voir leurs propres assignations
CREATE POLICY "Instructors view own assignments"
  ON public.module_instructors
  FOR SELECT
  USING (instructor_id = auth.uid());

-- Politique: Les utilisateurs assignés à une formation peuvent voir les formateurs des modules
CREATE POLICY "Users view formation module instructors"
  ON public.module_instructors
  FOR SELECT
  USING (
    module_id IN (
      SELECT fm.id FROM public.formation_modules fm
      WHERE fm.formation_id IN (
        SELECT formation_id FROM public.user_formation_assignments
        WHERE user_id = auth.uid()
      )
    )
  );

-- Politique: Les tuteurs peuvent voir les formateurs via leurs étudiants
CREATE POLICY "Tutors view student module instructors"
  ON public.module_instructors
  FOR SELECT
  USING (
    public.get_current_user_role() = 'Tuteur'
    AND module_id IN (
      SELECT fm.id FROM public.formation_modules fm
      WHERE fm.formation_id IN (
        SELECT ufa.formation_id 
        FROM public.user_formation_assignments ufa
        JOIN public.tutor_student_assignments tsa ON tsa.student_id = ufa.user_id
        WHERE tsa.tutor_id = auth.uid() AND tsa.is_active = true
      )
    )
  );