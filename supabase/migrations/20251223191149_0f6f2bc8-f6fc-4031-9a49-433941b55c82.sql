-- Fix infinite recursion in RLS for tutor_student_assignments by removing policies that reference tutors (which itself references tutor_student_assignments).

-- 1) Helper function to verify a tutor belongs to the current user's establishment
CREATE OR REPLACE FUNCTION public.tutor_in_current_establishment(_tutor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutors t
    WHERE t.id = _tutor_id
      AND t.establishment_id = public.get_current_user_establishment()
  );
$$;

-- 2) Replace problematic policies on tutor_student_assignments
DROP POLICY IF EXISTS "Tutors view own assignments" ON public.tutor_student_assignments;
DROP POLICY IF EXISTS "Tutors view student assignments" ON public.tutor_student_assignments;
DROP POLICY IF EXISTS "Admins manage tutor assignments" ON public.tutor_student_assignments;

-- Tutors can see assignments where they are the tutor
CREATE POLICY "Tutors can view own assignments"
ON public.tutor_student_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = tutor_id);

-- Students can see assignments where they are the student (their tutor link)
CREATE POLICY "Students can view own tutor assignment"
ON public.tutor_student_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Admins/AdminPrincipal can manage assignments within their establishment
CREATE POLICY "Admins manage tutor assignments"
ON public.tutor_student_assignments
FOR ALL
TO authenticated
USING (
  public.get_current_user_role() = ANY (ARRAY['Admin'::text,'AdminPrincipal'::text])
  AND public.tutor_in_current_establishment(tutor_id)
)
WITH CHECK (
  public.get_current_user_role() = ANY (ARRAY['Admin'::text,'AdminPrincipal'::text])
  AND public.tutor_in_current_establishment(tutor_id)
);
