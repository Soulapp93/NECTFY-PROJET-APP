-- Ajouter le champ qr_code à la table attendance_sheets pour stocker les codes QR uniques
ALTER TABLE public.attendance_sheets 
ADD COLUMN qr_code TEXT;

-- Ajouter un index sur le champ qr_code pour les recherches rapides
CREATE INDEX idx_attendance_sheets_qr_code ON public.attendance_sheets(qr_code);

-- Mettre à jour le trigger pour mettre à jour automatiquement updated_at
-- (Le trigger existe déjà, pas besoin de le recréer)

-- Ajouter quelques fonctions utilitaires pour la gestion des QR codes
CREATE OR REPLACE FUNCTION public.generate_attendance_qr_code(attendance_sheet_id_param uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Générer un code unique à 6 chiffres
    new_code := lpad(floor(random() * 1000000)::text, 6, '0');
    
    -- Vérifier l'unicité et régénérer si nécessaire
    WHILE EXISTS (SELECT 1 FROM attendance_sheets WHERE qr_code = new_code) LOOP
        new_code := lpad(floor(random() * 1000000)::text, 6, '0');
    END LOOP;
    
    -- Mettre à jour la feuille d'émargement avec le nouveau code
    UPDATE attendance_sheets 
    SET qr_code = new_code, updated_at = now() 
    WHERE id = attendance_sheet_id_param;
    
    RETURN new_code;
END;
$$;

-- Fonction pour valider un code QR
CREATE OR REPLACE FUNCTION public.validate_qr_code(code_param TEXT)
RETURNS TABLE(
    sheet_id uuid,
    formation_title text,
    date date,
    start_time time,
    end_time time,
    is_valid boolean
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        as1.id,
        f.title,
        as1.date,
        as1.start_time,
        as1.end_time,
        (as1.status = 'En cours' AND as1.is_open_for_signing = true) as is_valid
    FROM attendance_sheets as1
    JOIN formations f ON f.id = as1.formation_id
    WHERE as1.qr_code = code_param;
END;
$$;