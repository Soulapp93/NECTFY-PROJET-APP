-- Recreate view with security_invoker to ensure RLS policies are enforced
CREATE OR REPLACE VIEW public.tutor_students_view
WITH (security_invoker=on) AS
SELECT
  t.id AS tutor_id,
  t.first_name AS tutor_first_name,
  t.last_name AS tutor_last_name,
  t.email AS tutor_email,
  t.company_name,
  t."position",
  t.establishment_id AS tutor_establishment_id,
  t.is_activated,
  tsa.id AS assignment_id,
  tsa.student_id,
  tsa.is_active AS assignment_active,
  tsa.contract_type,
  tsa.contract_start_date,
  tsa.contract_end_date,
  u.first_name AS student_first_name,
  u.last_name AS student_last_name,
  u.email AS student_email,
  sf.formation_id,
  f.title AS formation_title,
  f.level AS formation_level,
  tsa.is_active
FROM public.tutors t
LEFT JOIN public.tutor_student_assignments tsa ON t.id = tsa.tutor_id
LEFT JOIN public.users u ON tsa.student_id = u.id
LEFT JOIN public.student_formations sf ON u.id = sf.student_id
LEFT JOIN public.formations f ON sf.formation_id = f.id;

-- Allow logged-in users to query the view (RLS will still apply via security_invoker)
GRANT SELECT ON public.tutor_students_view TO authenticated;