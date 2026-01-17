-- Améliorer les fonctions et triggers pour la gestion automatique des émargements

-- Fonction pour vérifier si l'émargement est ouvert (mise à jour)
CREATE OR REPLACE FUNCTION public.is_attendance_open_for_time(sheet_date date, start_time time without time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
    course_datetime TIMESTAMP WITH TIME ZONE;
    opening_time TIMESTAMP WITH TIME ZONE;
    closing_time TIMESTAMP WITH TIME ZONE;
    current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- Construire le timestamp complet du début du cours
    course_datetime := (sheet_date || ' ' || start_time)::TIMESTAMP WITH TIME ZONE;
    
    -- L'émargement ouvre 10 minutes avant le début du cours
    opening_time := course_datetime - INTERVAL '10 minutes';
    
    -- L'émargement ferme 30 minutes après le début du cours
    closing_time := course_datetime + INTERVAL '30 minutes';
    
    -- Retourner vrai si nous sommes dans la fenêtre d'ouverture
    RETURN current_time BETWEEN opening_time AND closing_time;
END;
$$;

-- Fonction pour obtenir le statut d'émargement basé sur l'heure
CREATE OR REPLACE FUNCTION public.get_attendance_status(sheet_date date, start_time time without time zone, current_status text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
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
    course_datetime := (sheet_date || ' ' || start_time)::TIMESTAMP WITH TIME ZONE;
    
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
$$;

-- Trigger pour mise à jour automatique du statut lors des requêtes SELECT
CREATE OR REPLACE FUNCTION public.update_attendance_status_on_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    -- Mettre à jour le statut et les flags basés sur l'heure actuelle
    NEW.status := public.get_attendance_status(NEW.date, NEW.start_time, NEW.status);
    NEW.is_open_for_signing := public.is_attendance_open_for_time(NEW.date, NEW.start_time);
    
    -- Mettre à jour opened_at si le statut devient "En cours" et opened_at est null  
    IF NEW.status = 'En cours' AND OLD.status != 'En cours' AND NEW.opened_at IS NULL THEN
        NEW.opened_at := NOW();
    END IF;
    
    -- Mettre à jour closed_at si le statut devient "En attente de validation" et closed_at est null
    IF NEW.status = 'En attente de validation' AND OLD.status != 'En attente de validation' AND NEW.closed_at IS NULL THEN
        NEW.closed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Appliquer le trigger sur les mises à jour de la table attendance_sheets
DROP TRIGGER IF EXISTS trigger_update_attendance_status ON attendance_sheets;
CREATE TRIGGER trigger_update_attendance_status
    BEFORE UPDATE ON attendance_sheets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_attendance_status_on_read();

-- Fonction pour obtenir les statistiques d'émargement
CREATE OR REPLACE FUNCTION public.get_attendance_stats(sheet_id uuid)
RETURNS TABLE(
    total_expected integer,
    total_signed integer,
    total_present integer,
    total_absent integer,
    attendance_rate numeric
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
    formation_id_val uuid;
    signed_count integer;
    present_count integer;
    absent_count integer;
    expected_count integer;
BEGIN
    -- Obtenir la formation_id de la feuille d'émargement
    SELECT as1.formation_id INTO formation_id_val
    FROM attendance_sheets as1
    WHERE as1.id = sheet_id;
    
    -- Compter les signatures
    SELECT 
        COUNT(*) FILTER (WHERE present = true),
        COUNT(*) FILTER (WHERE present = false),
        COUNT(*)
    INTO present_count, absent_count, signed_count
    FROM attendance_signatures
    WHERE attendance_sheet_id = sheet_id;
    
    -- Estimer le nombre attendu (basé sur les inscriptions à la formation)
    SELECT COALESCE(COUNT(*), 0) INTO expected_count
    FROM user_formation_assignments
    WHERE formation_id = formation_id_val;
    
    -- Si pas d'inscriptions enregistrées, utiliser un minimum basé sur les signatures
    IF expected_count = 0 THEN
        expected_count := GREATEST(signed_count, 1);
    END IF;
    
    RETURN QUERY SELECT 
        expected_count,
        signed_count,
        present_count,
        absent_count,
        CASE 
            WHEN expected_count > 0 THEN 
                ROUND((present_count::numeric / expected_count::numeric) * 100, 2)
            ELSE 0::numeric
        END;
END;
$$;