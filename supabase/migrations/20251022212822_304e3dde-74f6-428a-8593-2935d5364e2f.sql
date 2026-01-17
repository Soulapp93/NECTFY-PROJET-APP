-- Ajouter les champs nécessaires pour les séances en autonomie et les liens de signature
ALTER TABLE attendance_sheets 
ADD COLUMN session_type text DEFAULT 'presentiel' CHECK (session_type IN ('presentiel', 'autonomie', 'distanciel')),
ADD COLUMN signature_link_token text UNIQUE,
ADD COLUMN signature_link_expires_at timestamp with time zone,
ADD COLUMN signature_link_sent_at timestamp with time zone;

-- Index pour rechercher rapidement par token
CREATE INDEX idx_attendance_sheets_signature_token ON attendance_sheets(signature_link_token);

-- Fonction pour générer un token unique
CREATE OR REPLACE FUNCTION generate_signature_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Générer un token aléatoire unique
    LOOP
        new_token := encode(gen_random_bytes(32), 'base64');
        new_token := replace(replace(replace(new_token, '/', ''), '+', ''), '=', '');
        
        -- Vérifier l'unicité
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM attendance_sheets WHERE signature_link_token = new_token
        );
    END LOOP;
    
    RETURN new_token;
END;
$$;

-- Fonction pour valider un token de signature
CREATE OR REPLACE FUNCTION validate_signature_token(token_param text)
RETURNS TABLE(
    sheet_id uuid,
    formation_id uuid,
    formation_title text,
    date date,
    start_time time,
    end_time time,
    session_type text,
    is_valid boolean,
    expires_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ats.id,
        ats.formation_id,
        f.title,
        ats.date,
        ats.start_time,
        ats.end_time,
        ats.session_type,
        (ats.signature_link_expires_at > NOW() AND ats.status != 'Validé') as is_valid,
        ats.signature_link_expires_at
    FROM attendance_sheets ats
    JOIN formations f ON f.id = ats.formation_id
    WHERE ats.signature_link_token = token_param;
END;
$$;