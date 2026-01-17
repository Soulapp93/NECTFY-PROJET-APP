-- Créer la table des événements
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_date DATE,
  end_time TIME WITHOUT TIME ZONE,
  location TEXT,
  category TEXT NOT NULL,
  max_participants INTEGER DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Ouvert',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des inscriptions aux événements
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'Confirmée',
  UNIQUE(event_id, user_id)
);

-- Activer RLS sur les tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les événements (accès selon l'établissement)
CREATE POLICY "Users can view events from their establishment" 
ON public.events 
FOR SELECT 
USING (establishment_id = public.get_current_user_establishment());

CREATE POLICY "Users can create events in their establishment" 
ON public.events 
FOR INSERT 
WITH CHECK (establishment_id = public.get_current_user_establishment() AND auth.uid() = created_by);

CREATE POLICY "Users can update events they created" 
ON public.events 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Admins can update all events in their establishment" 
ON public.events 
FOR UPDATE 
USING (establishment_id = public.get_current_user_establishment() AND public.get_current_user_role() IN ('Administrateur', 'Super Administrateur'));

-- Politiques RLS pour les inscriptions
CREATE POLICY "Users can view their own registrations" 
ON public.event_registrations 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own registrations" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own registrations" 
ON public.event_registrations 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own registrations" 
ON public.event_registrations 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Event creators can view registrations for their events" 
ON public.event_registrations 
FOR SELECT 
USING (event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid()));

-- Triggers pour updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour obtenir les statistiques d'un événement
CREATE OR REPLACE FUNCTION public.get_event_stats(event_id_param UUID)
RETURNS TABLE(
  registered_count INTEGER,
  available_spots INTEGER
) 
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  max_participants_val INTEGER;
  registered_count_val INTEGER;
BEGIN
  -- Obtenir le nombre max de participants
  SELECT max_participants INTO max_participants_val
  FROM events
  WHERE id = event_id_param;
  
  -- Compter les inscriptions confirmées
  SELECT COUNT(*) INTO registered_count_val
  FROM event_registrations
  WHERE event_id = event_id_param AND status = 'Confirmée';
  
  RETURN QUERY SELECT 
    registered_count_val,
    GREATEST(0, COALESCE(max_participants_val, 0) - registered_count_val);
END;
$$;