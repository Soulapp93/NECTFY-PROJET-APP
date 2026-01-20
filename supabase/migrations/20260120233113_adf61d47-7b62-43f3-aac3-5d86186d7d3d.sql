-- Fix tutor_students_view to include position and formation_level columns
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
  t.position,
  t.establishment_id,
  t.is_activated,
  u.id as student_id,
  u.first_name as student_first_name,
  u.last_name as student_last_name,
  u.email as student_email,
  tsa.contract_type,
  tsa.contract_start_date,
  tsa.contract_end_date,
  tsa.is_active,
  f.id as formation_id,
  f.title as formation_title,
  f.level as formation_level
FROM tutors t
JOIN tutor_student_assignments tsa ON t.id = tsa.tutor_id
JOIN users u ON tsa.student_id = u.id
LEFT JOIN user_formation_assignments ufa ON u.id = ufa.user_id
LEFT JOIN formations f ON ufa.formation_id = f.id
WHERE tsa.is_active = true;

-- Grant access to authenticated users only
REVOKE ALL ON public.tutor_students_view FROM anon;
GRANT SELECT ON public.tutor_students_view TO authenticated;