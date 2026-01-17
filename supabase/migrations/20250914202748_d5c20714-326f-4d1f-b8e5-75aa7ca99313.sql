-- Fix the time comparison issue in attendance sheet functions
-- The error "operator does not exist: time with time zone < timestamp with time zone" indicates
-- we're comparing incompatible time types

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS update_attendance_sheet_status_trigger ON attendance_sheets;

-- Update the function to handle time types correctly
CREATE OR REPLACE FUNCTION public.update_attendance_sheet_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    course_start TIMESTAMP WITH TIME ZONE;
    opening_time TIMESTAMP WITH TIME ZONE;
    closing_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Construire le timestamp complet du début du cours en combinant date et time
    course_start := (NEW.date::text || ' ' || NEW.start_time::text)::TIMESTAMP WITH TIME ZONE;
    
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
$function$;

-- Also fix the other time-related functions
CREATE OR REPLACE FUNCTION public.is_attendance_open_for_time(sheet_date date, start_time time without time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
    course_datetime TIMESTAMP WITH TIME ZONE;
    opening_time TIMESTAMP WITH TIME ZONE;
    closing_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Construire le timestamp complet du début du cours
    course_datetime := (sheet_date::text || ' ' || start_time::text)::TIMESTAMP WITH TIME ZONE;
    
    -- L'émargement ouvre 10 minutes avant le début du cours
    opening_time := course_datetime - INTERVAL '10 minutes';
    
    -- L'émargement ferme 30 minutes après le début du cours
    closing_time := course_datetime + INTERVAL '30 minutes';
    
    -- Retourner vrai si nous sommes dans la fenêtre d'ouverture
    RETURN current_time BETWEEN opening_time AND closing_time;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_attendance_status(sheet_date date, start_time time without time zone, current_status text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
    course_datetime TIMESTAMP WITH TIME ZONE;
    opening_time TIMESTAMP WITH TIME ZONE;
    closing_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Ne pas changer le statut s'il est déjà validé
    IF current_status = 'Validé' THEN
        RETURN current_status;
    END IF;
    
    -- Construire le timestamp complet du début du cours
    course_datetime := (sheet_date::text || ' ' || start_time::text)::TIMESTAMP WITH TIME ZONE;
    
    -- L'émargement ouvre 10 minutes avant le début du cours
    opening_time := course_datetime - INTERVAL '10 minutes';
    
    -- L'émargement ferme 30 minutes après le début du cours
    closing_time := course_datetime + INTERVAL '30 minutes';
    
    -- Déterminer le statut basé sur l'heure
    IF current_time < opening_time THEN
        RETURN 'En attente';
    ELSIF current_time BETWEEN opening_time AND closing_time THEN
        RETURN 'En cours';
    ELSE
        RETURN 'En attente de validation';
    END IF;
END;
$function$;