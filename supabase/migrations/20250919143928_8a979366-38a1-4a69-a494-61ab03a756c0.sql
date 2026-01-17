-- Créer une table pour les tuteurs d'entreprise
CREATE TABLE public.tutors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company_name TEXT NOT NULL,
  company_address TEXT,
  position TEXT,
  is_activated BOOLEAN DEFAULT false,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table de relation entre tuteurs et apprentis
CREATE TABLE public.tutor_student_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  contract_type TEXT CHECK (contract_type IN ('Apprentissage', 'Professionnalisation')),
  contract_start_date DATE,
  contract_end_date DATE,
  UNIQUE(tutor_id, student_id)
);

-- Activer RLS sur les tables
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_student_assignments ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour les tuteurs
CREATE POLICY "Tutors can view their own profile" 
ON public.tutors 
FOR SELECT 
USING (auth.uid()::text = id::text);

CREATE POLICY "Tutors can update their own profile" 
ON public.tutors 
FOR UPDATE 
USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can manage all tutors" 
ON public.tutors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  )
);

-- Créer les politiques RLS pour les assignations tuteur-étudiant
CREATE POLICY "Tutors can view their student assignments" 
ON public.tutor_student_assignments 
FOR SELECT 
USING (auth.uid()::text = tutor_id::text);

CREATE POLICY "Admins can manage tutor assignments" 
ON public.tutor_student_assignments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  )
);

-- Créer des index pour les performances
CREATE INDEX idx_tutors_email ON public.tutors(email);
CREATE INDEX idx_tutors_establishment_id ON public.tutors(establishment_id);
CREATE INDEX idx_tutor_student_assignments_tutor_id ON public.tutor_student_assignments(tutor_id);
CREATE INDEX idx_tutor_student_assignments_student_id ON public.tutor_student_assignments(student_id);

-- Créer des triggers pour les timestamps
CREATE TRIGGER update_tutors_updated_at
BEFORE UPDATE ON public.tutors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer une vue pour faciliter l'accès aux données des tuteurs avec leurs apprentis
CREATE OR REPLACE VIEW public.tutor_students_view AS
SELECT 
  t.id as tutor_id,
  t.first_name as tutor_first_name,
  t.last_name as tutor_last_name,
  t.email as tutor_email,
  t.company_name,
  t.position,
  t.is_activated,
  u.id as student_id,
  u.first_name as student_first_name,
  u.last_name as student_last_name,
  u.email as student_email,
  tsa.contract_type,
  tsa.contract_start_date,
  tsa.contract_end_date,
  tsa.is_active,
  f.id as formation_id,
  f.title as formation_title,
  f.level as formation_level
FROM public.tutors t
JOIN public.tutor_student_assignments tsa ON t.id = tsa.tutor_id
JOIN public.users u ON tsa.student_id = u.id
LEFT JOIN public.user_formation_assignments ufa ON u.id = ufa.user_id
LEFT JOIN public.formations f ON ufa.formation_id = f.id
WHERE tsa.is_active = true;