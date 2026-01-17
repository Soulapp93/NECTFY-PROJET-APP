
-- Créer les tables pour les contenus de modules
CREATE TABLE public.module_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.formation_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('cours', 'support', 'video', 'document')),
  file_url TEXT,
  file_name TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer les tables pour les devoirs et évaluations
CREATE TABLE public.module_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.formation_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('devoir', 'evaluation')),
  due_date TIMESTAMP WITH TIME ZONE,
  max_points INTEGER DEFAULT 100,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer les tables pour les fichiers joints aux devoirs
CREATE TABLE public.assignment_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.module_assignments(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer les tables pour les soumissions d'étudiants
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.module_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) NOT NULL,
  submission_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Créer les tables pour les fichiers de soumission
CREATE TABLE public.submission_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.assignment_submissions(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer les tables pour les corrections
CREATE TABLE public.assignment_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.assignment_submissions(id) ON DELETE CASCADE NOT NULL,
  corrected_by UUID REFERENCES public.users(id) NOT NULL,
  score INTEGER,
  max_score INTEGER DEFAULT 100,
  comments TEXT,
  is_corrected BOOLEAN DEFAULT false,
  corrected_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id)
);

-- Créer les tables pour les documents de module
CREATE TABLE public.module_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.formation_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT NOT NULL CHECK (document_type IN ('article', 'support', 'reference', 'autre')),
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.module_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_documents ENABLE ROW LEVEL SECURITY;

-- Policies pour module_contents
CREATE POLICY "Allow all for development contents" ON public.module_contents FOR ALL USING (true);

-- Policies pour module_assignments
CREATE POLICY "Allow all for development assignments" ON public.module_assignments FOR ALL USING (true);

-- Policies pour assignment_files
CREATE POLICY "Allow all for development assignment_files" ON public.assignment_files FOR ALL USING (true);

-- Policies pour assignment_submissions
CREATE POLICY "Allow all for development submissions" ON public.assignment_submissions FOR ALL USING (true);

-- Policies pour submission_files
CREATE POLICY "Allow all for development submission_files" ON public.submission_files FOR ALL USING (true);

-- Policies pour assignment_corrections
CREATE POLICY "Allow all for development corrections" ON public.assignment_corrections FOR ALL USING (true);

-- Policies pour module_documents
CREATE POLICY "Allow all for development documents" ON public.module_documents FOR ALL USING (true);
