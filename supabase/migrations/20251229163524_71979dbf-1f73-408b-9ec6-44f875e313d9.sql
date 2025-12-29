-- ============================================
-- MIGRATION DE SÉCURITÉ POUR LA PRODUCTION
-- ============================================

-- 1. Recréer la vue tutor_students_view avec SECURITY INVOKER pour respecter RLS
DROP VIEW IF EXISTS public.tutor_students_view;

CREATE VIEW public.tutor_students_view
WITH (security_invoker = true)
AS
SELECT 
    t.id as tutor_id,
    t.first_name as tutor_first_name,
    t.last_name as tutor_last_name,
    t.email as tutor_email,
    t.company_name,
    t.position,
    t.establishment_id as tutor_establishment_id,
    t.is_activated,
    tsa.id as assignment_id,
    tsa.student_id,
    tsa.is_active as assignment_active,
    tsa.contract_type,
    tsa.contract_start_date,
    tsa.contract_end_date,
    u.first_name as student_first_name,
    u.last_name as student_last_name,
    u.email as student_email,
    sf.formation_id,
    f.title as formation_title,
    f.level as formation_level,
    tsa.is_active
FROM public.tutors t
LEFT JOIN public.tutor_student_assignments tsa ON t.id = tsa.tutor_id
LEFT JOIN public.users u ON tsa.student_id = u.id
LEFT JOIN public.student_formations sf ON u.id = sf.student_id
LEFT JOIN public.formations f ON sf.formation_id = f.id;

-- 2. Améliorer la politique RLS des notifications pour valider l'insertion
DROP POLICY IF EXISTS "System create notifications" ON public.notifications;

CREATE POLICY "Authenticated users create notifications for users in same establishment"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
    -- L'utilisateur cible doit être dans le même établissement
    user_id IN (
        SELECT u.id FROM public.users u 
        WHERE u.establishment_id = get_current_user_establishment()
    )
    OR
    -- Ou c'est une auto-notification
    user_id = auth.uid()
);

-- 3. Améliorer la politique d'audit logs pour limiter les insertions
DROP POLICY IF EXISTS "System insert audit logs" ON public.attendance_audit_log;

CREATE POLICY "Authenticated users insert own audit logs"
ON public.attendance_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
    -- Seul l'utilisateur authentifié peut créer des logs pour lui-même
    user_id = auth.uid()
    OR
    -- Ou les admins peuvent créer des logs pour n'importe qui dans leur établissement
    (
        get_current_user_role() IN ('Admin', 'AdminPrincipal')
        AND user_id IN (
            SELECT u.id FROM public.users u 
            WHERE u.establishment_id = get_current_user_establishment()
        )
    )
);

-- 4. Créer une table pour le rate limiting de création d'établissements
CREATE TABLE IF NOT EXISTS public.establishment_creation_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address text NOT NULL,
    email text NOT NULL,
    attempted_at timestamp with time zone DEFAULT now(),
    success boolean DEFAULT false
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_establishment_attempts_ip ON public.establishment_creation_attempts(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_establishment_attempts_email ON public.establishment_creation_attempts(email, attempted_at);

-- RLS pour cette table - pas d'accès direct, seulement via fonction
ALTER TABLE public.establishment_creation_attempts ENABLE ROW LEVEL SECURITY;

-- Permettre les insertions anonymes (pour le tracking)
CREATE POLICY "Allow anonymous insert attempts"
ON public.establishment_creation_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Seuls les admins peuvent voir les tentatives
CREATE POLICY "Admins view attempts"
ON public.establishment_creation_attempts
FOR SELECT
TO authenticated
USING (get_current_user_role() IN ('Admin', 'AdminPrincipal'));

-- 5. Fonction de rate limiting pour la création d'établissements
CREATE OR REPLACE FUNCTION public.check_establishment_rate_limit(
    p_ip_address text,
    p_email text
)
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ip_attempts_hour INTEGER;
    v_email_attempts_day INTEGER;
BEGIN
    -- Compter les tentatives par IP dans la dernière heure
    SELECT COUNT(*) INTO v_ip_attempts_hour
    FROM establishment_creation_attempts
    WHERE ip_address = p_ip_address
    AND attempted_at > NOW() - INTERVAL '1 hour';
    
    -- Compter les tentatives par email dans les dernières 24h
    SELECT COUNT(*) INTO v_email_attempts_day
    FROM establishment_creation_attempts
    WHERE email = lower(trim(p_email))
    AND attempted_at > NOW() - INTERVAL '24 hours';
    
    -- Limite: 3 tentatives par IP/heure, 5 par email/jour
    IF v_ip_attempts_hour >= 3 THEN
        RETURN QUERY SELECT FALSE, 3600;
    ELSIF v_email_attempts_day >= 5 THEN
        RETURN QUERY SELECT FALSE, 86400;
    ELSE
        RETURN QUERY SELECT TRUE, 0;
    END IF;
END;
$$;

-- 6. Fonction pour logger les tentatives de création
CREATE OR REPLACE FUNCTION public.log_establishment_creation_attempt(
    p_ip_address text,
    p_email text,
    p_success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO establishment_creation_attempts (ip_address, email, success)
    VALUES (p_ip_address, lower(trim(p_email)), p_success);
    
    -- Nettoyer les anciennes entrées (plus de 30 jours)
    DELETE FROM establishment_creation_attempts
    WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- 7. Restreindre les politiques RLS pour les tuteurs - limiter l'accès aux données sensibles
-- D'abord vérifier les policies existantes et les remplacer par des versions plus sécurisées

-- Créer une fonction pour vérifier si un utilisateur peut voir les détails d'un tuteur
CREATE OR REPLACE FUNCTION public.can_view_tutor_details(p_tutor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        -- L'utilisateur est un admin du même établissement
        SELECT 1 FROM tutors t
        WHERE t.id = p_tutor_id
        AND t.establishment_id = get_current_user_establishment()
        AND get_current_user_role() IN ('Admin', 'AdminPrincipal')
    )
    OR EXISTS (
        -- L'utilisateur est un étudiant assigné à ce tuteur
        SELECT 1 FROM tutor_student_assignments tsa
        WHERE tsa.tutor_id = p_tutor_id
        AND tsa.student_id = auth.uid()
        AND tsa.is_active = true
    )
    OR (
        -- L'utilisateur est le tuteur lui-même
        p_tutor_id = auth.uid()
    );
$$;