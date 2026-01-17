
-- Créer la fonction pour obtenir les IDs des étudiants d'un tuteur
CREATE OR REPLACE FUNCTION public.get_tutor_students(_tutor_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id
  FROM public.tutor_student_assignments
  WHERE tutor_id = _tutor_id
    AND is_active = true;
$$;
