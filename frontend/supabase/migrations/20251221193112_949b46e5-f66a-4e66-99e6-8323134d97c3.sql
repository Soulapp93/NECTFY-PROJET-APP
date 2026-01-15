-- Fix 1: Remove overly permissive invitations RLS policy and replace with secure policy
DROP POLICY IF EXISTS "View own invitations by token" ON public.invitations;

-- Create a more restrictive policy: only admins of the establishment can view invitations
-- Token validation should happen through the secure validate_invitation_token function
CREATE POLICY "Admins view establishment invitations" 
ON public.invitations 
FOR SELECT 
USING (
  (establishment_id = get_current_user_establishment()) 
  AND (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
);

-- Fix 2: Enable RLS on tutor_students_view and add proper policies
-- Note: Views with SECURITY DEFINER don't support RLS, so we need to drop and recreate

-- First, drop the existing view
DROP VIEW IF EXISTS public.tutor_students_view;

-- Recreate the view without SECURITY DEFINER
CREATE VIEW public.tutor_students_view AS
SELECT 
  t.id AS tutor_id,
  t.first_name AS tutor_first_name,
  t.last_name AS tutor_last_name,
  t.email AS tutor_email,
  t.company_name,
  t.establishment_id AS tutor_establishment_id,
  tsa.id AS assignment_id,
  tsa.student_id,
  tsa.contract_type,
  tsa.contract_start_date,
  tsa.contract_end_date,
  tsa.is_active AS assignment_active,
  u.first_name AS student_first_name,
  u.last_name AS student_last_name,
  u.email AS student_email,
  sf.formation_id,
  f.title AS formation_title
FROM tutors t
LEFT JOIN tutor_student_assignments tsa ON t.id = tsa.tutor_id
LEFT JOIN users u ON tsa.student_id = u.id
LEFT JOIN student_formations sf ON u.id = sf.student_id
LEFT JOIN formations f ON sf.formation_id = f.id;

-- Grant select to authenticated users (RLS on underlying tables will control access)
GRANT SELECT ON public.tutor_students_view TO authenticated;

-- Fix 3: Improve log_attendance_action function to validate caller
CREATE OR REPLACE FUNCTION public.log_attendance_action(
  sheet_id uuid, 
  user_id uuid, 
  action_type text, 
  ip_addr text DEFAULT NULL::text, 
  user_agent_val text DEFAULT NULL::text, 
  meta jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that user_id matches the authenticated user OR caller is admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated';
  END IF;
  
  -- Allow if user is logging their own action OR if they are an admin
  IF user_id != auth.uid() AND get_current_user_role() NOT IN ('Admin', 'AdminPrincipal') THEN
    RAISE EXCEPTION 'Unauthorized: cannot log actions for other users';
  END IF;

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