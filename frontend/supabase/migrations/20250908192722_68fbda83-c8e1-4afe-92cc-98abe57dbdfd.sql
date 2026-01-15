-- Ajout du champ motif d'absence dans les signatures
ALTER TABLE public.attendance_signatures 
ADD COLUMN absence_reason TEXT,
ADD COLUMN absence_reason_type TEXT CHECK (absence_reason_type IN ('congé', 'arret_travail', 'autre', 'injustifié', 'mission_professionnelle', 'entreprise'));

-- Ajout d'un statut plus détaillé pour les feuilles d'émargement
ALTER TABLE public.attendance_sheets 
ADD COLUMN is_open_for_signing BOOLEAN DEFAULT false,
ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN validated_by UUID;

-- Fonction pour déterminer si l'émargement est ouvert
CREATE OR REPLACE FUNCTION public.is_attendance_open(sheet_date DATE, start_time TIME)
RETURNS BOOLEAN AS $$
DECLARE
    course_start TIMESTAMP WITH TIME ZONE;
    opening_time TIMESTAMP WITH TIME ZONE;
    closing_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Construire le timestamp complet du début du cours
    course_start := (sheet_date || ' ' || start_time)::TIMESTAMP WITH TIME ZONE;
    
    -- L'émargement ouvre 10 minutes avant le début du cours
    opening_time := course_start - INTERVAL '10 minutes';
    
    -- L'émargement ferme 30 minutes après le début du cours
    closing_time := course_start + INTERVAL '30 minutes';
    
    -- Retourner vrai si nous sommes dans la fenêtre d'ouverture
    RETURN current_time BETWEEN opening_time AND closing_time;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour mettre à jour automatiquement le statut des feuilles d'émargement
CREATE OR REPLACE FUNCTION public.update_attendance_sheet_status()
RETURNS TRIGGER AS $$
DECLARE
    course_start TIMESTAMP WITH TIME ZONE;
    opening_time TIMESTAMP WITH TIME ZONE;
    closing_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Construire le timestamp complet du début du cours
    course_start := (NEW.date || ' ' || NEW.start_time)::TIMESTAMP WITH TIME ZONE;
    
    -- L'émargement ouvre 10 minutes avant le début du cours
    opening_time := course_start - INTERVAL '10 minutes';
    
    -- L'émargement ferme 30 minutes après le début du cours  
    closing_time := course_start + INTERVAL '30 minutes';
    
    -- Mettre à jour les champs selon la logique temporelle
    IF current_time < opening_time THEN
        NEW.status := 'En attente';
        NEW.is_open_for_signing := FALSE;
    ELSIF current_time BETWEEN opening_time AND closing_time THEN
        NEW.status := 'En cours';
        NEW.is_open_for_signing := TRUE;
        IF NEW.opened_at IS NULL THEN
            NEW.opened_at := current_time;
        END IF;
    ELSIF current_time > closing_time AND NEW.status != 'Validé' THEN
        NEW.status := 'En attente de validation';
        NEW.is_open_for_signing := FALSE;
        IF NEW.closed_at IS NULL THEN
            NEW.closed_at := current_time;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le statut
DROP TRIGGER IF EXISTS trigger_update_attendance_status ON public.attendance_sheets;
CREATE TRIGGER trigger_update_attendance_status
    BEFORE INSERT OR UPDATE ON public.attendance_sheets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_attendance_sheet_status();