-- Correction des warnings de sécurité - ajout du SET search_path aux fonctions

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
$$ LANGUAGE plpgsql STABLE SET search_path = public;

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
$$ LANGUAGE plpgsql SET search_path = public;