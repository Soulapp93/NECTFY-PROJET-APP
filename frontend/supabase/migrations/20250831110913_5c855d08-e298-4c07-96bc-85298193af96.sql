
-- Création de la table des établissements (multi-tenant)
CREATE TABLE public.establishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('université', 'école supérieure', 'centre de formation')),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Création du type énuméré pour les rôles
CREATE TYPE public.user_role AS ENUM ('Admin', 'Formateur', 'Étudiant');

-- Création du type énuméré pour les statuts
CREATE TYPE public.user_status AS ENUM ('Actif', 'Inactif', 'En attente');

-- Création de la table des utilisateurs
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'Étudiant',
  status public.user_status NOT NULL DEFAULT 'En attente',
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(establishment_id, email)
);

-- Création de la table des formations
CREATE TABLE public.formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  duration INTEGER NOT NULL, -- en heures
  max_students INTEGER NOT NULL DEFAULT 25,
  price DECIMAL(10,2),
  instructor_id UUID REFERENCES public.users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Inactif', 'Terminé')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Création de la table d'inscription des étudiants aux formations
CREATE TABLE public.student_formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, formation_id)
);

-- Activation de RLS sur toutes les tables
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_formations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS temporaires (à ajuster avec l'authentification)
-- Pour l'instant, accès complet pour le développement
CREATE POLICY "Allow all for development" ON public.establishments FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON public.formations FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON public.student_formations FOR ALL USING (true);

-- Insertion d'un établissement de test
INSERT INTO public.establishments (name, type, email, phone, address) 
VALUES ('Université de Test', 'université', 'admin@universite-test.fr', '01 23 45 67 89', '123 Rue de l''Université, Paris');
