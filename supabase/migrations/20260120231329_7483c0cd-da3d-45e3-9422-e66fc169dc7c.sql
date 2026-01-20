-- =====================================================
-- SECURITY HARDENING MIGRATION - PRODUCTION READY
-- =====================================================

-- 1. PROTECT USERS TABLE FROM ANONYMOUS ACCESS
-- Ensure only authenticated users can access user data
CREATE POLICY "Deny anonymous access to users"
ON public.users
FOR SELECT
TO anon
USING (false);

-- 2. PROTECT ATTENDANCE_SHEETS FROM ANONYMOUS ACCESS
-- Prevent token/QR code exposure to unauthenticated users
CREATE POLICY "Deny anonymous access to attendance_sheets"
ON public.attendance_sheets
FOR SELECT
TO anon
USING (false);

-- 3. PROTECT TUTOR_STUDENTS_VIEW
-- Update the view to use security_invoker to respect RLS
-- First drop and recreate with security_invoker option
DROP VIEW IF EXISTS public.tutor_students_view;

CREATE VIEW public.tutor_students_view
WITH (security_invoker = on)
AS
SELECT 
  t.id as tutor_id,
  t.first_name as tutor_first_name,
  t.last_name as tutor_last_name,
  t.email as tutor_email,
  t.company_name,
  t.establishment_id,
  u.id as student_id,
  u.first_name as student_first_name,
  u.last_name as student_last_name,
  u.email as student_email,
  tsa.contract_type,
  tsa.contract_start_date,
  tsa.contract_end_date,
  tsa.is_active,
  f.id as formation_id,
  f.title as formation_title
FROM tutors t
JOIN tutor_student_assignments tsa ON t.id = tsa.tutor_id
JOIN users u ON tsa.student_id = u.id
LEFT JOIN user_formation_assignments ufa ON u.id = ufa.user_id
LEFT JOIN formations f ON ufa.formation_id = f.id
WHERE tsa.is_active = true;

-- Grant access to authenticated users only
REVOKE ALL ON public.tutor_students_view FROM anon;
GRANT SELECT ON public.tutor_students_view TO authenticated;

-- 4. Additional security: Protect user_activation_tokens
CREATE POLICY "Deny anonymous access to activation_tokens"
ON public.user_activation_tokens
FOR SELECT
TO anon
USING (false);

-- 5. Protect attendance_signatures from anonymous access
CREATE POLICY "Deny anonymous access to attendance_signatures"
ON public.attendance_signatures
FOR SELECT
TO anon
USING (false);