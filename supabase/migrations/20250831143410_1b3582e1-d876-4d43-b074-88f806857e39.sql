
-- Créer une table pour les tokens d'activation
CREATE TABLE public.user_activation_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter RLS sur la table des tokens
ALTER TABLE public.user_activation_tokens ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres tokens
CREATE POLICY "Users can view their own activation tokens" 
  ON public.user_activation_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Créer une table pour gérer les inscriptions des utilisateurs aux formations
CREATE TABLE public.user_formation_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  formation_id UUID REFERENCES public.formations(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, formation_id)
);

-- Ajouter RLS sur la table des assignations
ALTER TABLE public.user_formation_assignments ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture de toutes les assignations (pour développement)
CREATE POLICY "Allow all for development assignments" 
  ON public.user_formation_assignments 
  FOR ALL 
  USING (true);

-- Ajouter une colonne pour indiquer si le compte est activé
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT false;

-- Ajouter une colonne pour le hash du mot de passe temporaire (optionnel)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS temp_password_hash TEXT;
