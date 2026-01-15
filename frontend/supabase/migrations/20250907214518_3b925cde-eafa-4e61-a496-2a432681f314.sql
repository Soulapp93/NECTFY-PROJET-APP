-- Créer les tables pour le système d'émargement

-- Table pour les feuilles d'émargement
CREATE TABLE public.attendance_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_slot_id UUID NOT NULL,
  formation_id UUID NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_id UUID,
  room TEXT,
  status TEXT NOT NULL DEFAULT 'En attente',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les signatures d'émargement
CREATE TABLE public.attendance_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_sheet_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'instructor')),
  signature_data TEXT, -- Base64 de la signature
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  present BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.attendance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_signatures ENABLE ROW LEVEL SECURITY;

-- Politiques pour les feuilles d'émargement
CREATE POLICY "Allow all for development attendance_sheets" 
ON public.attendance_sheets 
FOR ALL 
USING (true);

-- Politiques pour les signatures
CREATE POLICY "Allow all for development attendance_signatures" 
ON public.attendance_signatures 
FOR ALL 
USING (true);

-- Trigger pour update automatique
CREATE TRIGGER update_attendance_sheets_updated_at
BEFORE UPDATE ON public.attendance_sheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_signatures_updated_at
BEFORE UPDATE ON public.attendance_signatures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_attendance_sheets_formation_date ON public.attendance_sheets(formation_id, date);
CREATE INDEX idx_attendance_sheets_schedule_slot ON public.attendance_sheets(schedule_slot_id);
CREATE INDEX idx_attendance_signatures_sheet_user ON public.attendance_signatures(attendance_sheet_id, user_id);
CREATE INDEX idx_attendance_signatures_user_date ON public.attendance_signatures(user_id, signed_at);