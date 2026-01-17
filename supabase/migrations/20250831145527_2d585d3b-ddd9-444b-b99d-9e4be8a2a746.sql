
-- Créer une table pour les modules de formation
CREATE TABLE public.formation_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour assigner les formateurs aux modules
CREATE TABLE public.module_instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.formation_modules(id) ON DELETE CASCADE NOT NULL,
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_id, instructor_id)
);

-- Ajouter RLS sur les tables
ALTER TABLE public.formation_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_instructors ENABLE ROW LEVEL SECURITY;

-- Politiques pour permettre toutes les opérations (développement)
CREATE POLICY "Allow all for development modules" 
  ON public.formation_modules 
  FOR ALL 
  USING (true);

CREATE POLICY "Allow all for development module instructors" 
  ON public.module_instructors 
  FOR ALL 
  USING (true);

-- Supprimer la colonne instructor_id de la table formations car maintenant les formateurs sont assignés aux modules
ALTER TABLE public.formations DROP COLUMN IF EXISTS instructor_id;
