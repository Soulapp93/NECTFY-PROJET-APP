-- Drop and recreate tutor_students_view with all required columns (no SECURITY DEFINER)
DROP VIEW IF EXISTS public.tutor_students_view;

CREATE VIEW public.tutor_students_view AS
SELECT 
    t.id AS tutor_id,
    t.first_name AS tutor_first_name,
    t.last_name AS tutor_last_name,
    t.email AS tutor_email,
    t.company_name,
    t.position,
    t.is_activated,
    t.establishment_id AS tutor_establishment_id,
    tsa.id AS assignment_id,
    tsa.student_id,
    tsa.contract_type,
    tsa.contract_start_date,
    tsa.contract_end_date,
    tsa.is_active,
    u.first_name AS student_first_name,
    u.last_name AS student_last_name,
    u.email AS student_email,
    sf.formation_id,
    f.title AS formation_title,
    f.level AS formation_level,
    COALESCE(tsa.is_active, false) AS assignment_active
FROM tutors t
LEFT JOIN tutor_student_assignments tsa ON t.id = tsa.tutor_id
LEFT JOIN users u ON tsa.student_id = u.id
LEFT JOIN student_formations sf ON u.id = sf.student_id
LEFT JOIN formations f ON sf.formation_id = f.id;

-- Grant access to authenticated users (RLS on underlying tables controls access)
GRANT SELECT ON public.tutor_students_view TO authenticated;