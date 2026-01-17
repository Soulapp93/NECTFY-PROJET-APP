-- Fix infinite recursion in RLS by moving instructor-formation check into a SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.is_instructor_for_formation(_formation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.schedules sch
    JOIN public.schedule_slots slot ON slot.schedule_id = sch.id
    WHERE sch.formation_id = _formation_id
      AND slot.instructor_id = _user_id
  );
$$;

-- Update the policy to use the function (avoids referencing tables with RLS recursion inside the policy)
DROP POLICY IF EXISTS "Instructors view assignments for formations they teach" ON public.user_formation_assignments;

CREATE POLICY "Instructors view assignments for formations they teach"
ON public.user_formation_assignments
FOR SELECT
TO authenticated
USING (public.is_instructor_for_formation(user_formation_assignments.formation_id, auth.uid()));
