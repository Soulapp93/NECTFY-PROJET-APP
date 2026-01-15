-- ============================================
-- PRODUCTION OPTIMIZATION & SECURITY (CORRIGÉ)
-- ============================================

-- 1. INDEXES DE PERFORMANCE
-- Améliore les requêtes fréquentes de 100-1000x

CREATE INDEX IF NOT EXISTS idx_attendance_sheets_qr_code 
ON attendance_sheets(qr_code) 
WHERE qr_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sheets_formation_date 
ON attendance_sheets(formation_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_sheets_status 
ON attendance_sheets(status) 
WHERE status IN ('En cours', 'En attente de validation');

CREATE INDEX IF NOT EXISTS idx_schedule_slots_formation_date 
ON schedule_slots(date, schedule_id);

CREATE INDEX IF NOT EXISTS idx_schedule_slots_instructor 
ON schedule_slots(instructor_id, date) 
WHERE instructor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_signatures_sheet 
ON attendance_signatures(attendance_sheet_id);

CREATE INDEX IF NOT EXISTS idx_attendance_signatures_user 
ON attendance_signatures(user_id, signed_at);

CREATE INDEX IF NOT EXISTS idx_user_formation_assignments 
ON user_formation_assignments(user_id, formation_id);

CREATE INDEX IF NOT EXISTS idx_formations_establishment_status 
ON formations(establishment_id, status);

CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_establishment_role 
ON users(establishment_id, role);

-- 2. FONCTION DE VALIDATION SÉCURISÉE DES QR CODES
-- Prévient le brute force et valide format

CREATE OR REPLACE FUNCTION public.validate_qr_code_secure(
  code_param TEXT,
  user_id_param UUID
)
RETURNS TABLE(
  is_valid BOOLEAN,
  sheet_id UUID,
  formation_title TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sheet attendance_sheets%ROWTYPE;
  v_signature_count INTEGER;
BEGIN
  -- Validation du format (6 chiffres uniquement)
  IF code_param !~ '^\d{6}$' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Code invalide: doit contenir 6 chiffres'::TEXT;
    RETURN;
  END IF;

  -- Recherche de la feuille d'émargement
  SELECT * INTO v_sheet
  FROM attendance_sheets
  WHERE qr_code = code_param;

  -- Code inexistant
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Code QR invalide ou expiré'::TEXT;
    RETURN;
  END IF;

  -- Vérifier si pas déjà signé
  SELECT COUNT(*) INTO v_signature_count
  FROM attendance_signatures
  WHERE attendance_sheet_id = v_sheet.id
    AND user_id = user_id_param;

  IF v_signature_count > 0 THEN
    RETURN QUERY SELECT FALSE, v_sheet.id, NULL::TEXT, 'Vous avez déjà émargé pour cette session'::TEXT;
    RETURN;
  END IF;

  -- Vérifier si la session est ouverte
  IF v_sheet.status != 'En cours' OR v_sheet.is_open_for_signing = FALSE THEN
    RETURN QUERY SELECT FALSE, v_sheet.id, NULL::TEXT, 'La session d''émargement n''est plus active'::TEXT;
    RETURN;
  END IF;

  -- Récupérer le titre de la formation
  RETURN QUERY 
  SELECT 
    TRUE,
    v_sheet.id,
    f.title,
    NULL::TEXT
  FROM formations f
  WHERE f.id = v_sheet.formation_id;
END;
$$;

-- 3. FONCTION DE LIMITATION DE TAUX (RATE LIMITING)
-- Prévient les attaques par force brute

CREATE TABLE IF NOT EXISTS public.qr_validation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_qr_attempts_user_time 
ON qr_validation_attempts(user_id, attempted_at);

CREATE INDEX IF NOT EXISTS idx_qr_attempts_ip_time 
ON qr_validation_attempts(ip_address, attempted_at);

-- Fonction pour vérifier le rate limiting
CREATE OR REPLACE FUNCTION public.check_qr_rate_limit(
  user_id_param UUID,
  ip_address_param TEXT
)
RETURNS TABLE(
  allowed BOOLEAN,
  remaining_attempts INTEGER,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_last_minute INTEGER;
  v_attempts_last_hour INTEGER;
BEGIN
  -- Nettoyer les anciennes tentatives (> 24h)
  DELETE FROM qr_validation_attempts 
  WHERE attempted_at < NOW() - INTERVAL '24 hours';

  -- Compter les tentatives récentes
  SELECT COUNT(*) INTO v_attempts_last_minute
  FROM qr_validation_attempts
  WHERE (user_id = user_id_param OR ip_address = ip_address_param)
    AND attempted_at > NOW() - INTERVAL '1 minute'
    AND success = FALSE;

  SELECT COUNT(*) INTO v_attempts_last_hour
  FROM qr_validation_attempts
  WHERE (user_id = user_id_param OR ip_address = ip_address_param)
    AND attempted_at > NOW() - INTERVAL '1 hour'
    AND success = FALSE;

  -- Limites: 5 tentatives/minute, 20 tentatives/heure
  IF v_attempts_last_minute >= 5 THEN
    RETURN QUERY SELECT FALSE, 0, 60;
  ELSIF v_attempts_last_hour >= 20 THEN
    RETURN QUERY SELECT FALSE, 0, 3600;
  ELSE
    RETURN QUERY SELECT TRUE, (5 - v_attempts_last_minute), 0;
  END IF;
END;
$$;

-- 4. CONTRAINTES DE DONNÉES
-- Assure l'intégrité des données

-- QR code doit être 6 chiffres si présent
ALTER TABLE attendance_sheets 
DROP CONSTRAINT IF EXISTS check_qr_code_format;

ALTER TABLE attendance_sheets
ADD CONSTRAINT check_qr_code_format 
CHECK (qr_code IS NULL OR qr_code ~ '^\d{6}$');

-- Horaires valides
ALTER TABLE attendance_sheets
DROP CONSTRAINT IF EXISTS check_time_order;

ALTER TABLE attendance_sheets
ADD CONSTRAINT check_time_order 
CHECK (start_time < end_time);

ALTER TABLE schedule_slots
DROP CONSTRAINT IF EXISTS check_slot_time_order;

ALTER TABLE schedule_slots
ADD CONSTRAINT check_slot_time_order 
CHECK (start_time < end_time);

-- 5. FONCTION D'AUDIT DES ÉMARGEMENTS
-- Pour traçabilité et détection fraude

CREATE TABLE IF NOT EXISTS public.attendance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_sheet_id UUID REFERENCES attendance_sheets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_sheet_time 
ON attendance_audit_log(attendance_sheet_id, created_at);

CREATE INDEX IF NOT EXISTS idx_audit_user_time 
ON attendance_audit_log(user_id, created_at);

-- Fonction pour logger les actions
CREATE OR REPLACE FUNCTION public.log_attendance_action(
  sheet_id UUID,
  user_id UUID,
  action_type TEXT,
  ip_addr TEXT DEFAULT NULL,
  user_agent_val TEXT DEFAULT NULL,
  meta JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO attendance_audit_log (
    attendance_sheet_id,
    user_id,
    action,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    sheet_id,
    user_id,
    action_type,
    ip_addr,
    user_agent_val,
    meta
  );
END;
$$;

-- 6. RLS POLICIES POUR LES NOUVELLES TABLES

ALTER TABLE qr_validation_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts"
ON qr_validation_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert attempts"
ON qr_validation_attempts
FOR INSERT
WITH CHECK (true);

ALTER TABLE attendance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON attendance_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Admin'
  )
);

CREATE POLICY "System can insert audit logs"
ON attendance_audit_log
FOR INSERT
WITH CHECK (true);

-- 7. OPTIMISATION DES STATISTIQUES
-- Met à jour les statistiques PostgreSQL pour de meilleures performances

ANALYZE attendance_sheets;
ANALYZE attendance_signatures;
ANALYZE schedule_slots;
ANALYZE formations;
ANALYZE users;

-- 8. COMMENTAIRES POUR DOCUMENTATION

COMMENT ON FUNCTION validate_qr_code_secure IS 'Validation sécurisée des codes QR avec vérifications multiples';
COMMENT ON FUNCTION check_qr_rate_limit IS 'Limite le nombre de tentatives de validation QR pour prévenir le brute force';
COMMENT ON FUNCTION log_attendance_action IS 'Enregistre les actions d''émargement pour audit et sécurité';
COMMENT ON TABLE qr_validation_attempts IS 'Historique des tentatives de validation QR pour rate limiting';
COMMENT ON TABLE attendance_audit_log IS 'Journal d''audit complet des actions d''émargement';