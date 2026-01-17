-- Allow instructors to read formation assignments (used as fallback for enrollment lists)
-- This prevents empty participant lists when data is stored in user_formation_assignments.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_formation_assignments'
      AND policyname = 'Instructors view assignments for their sessions'
  ) THEN
    CREATE POLICY "Instructors view assignments for their sessions"
    ON public.user_formation_assignments
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.attendance_sheets s
        WHERE s.formation_id = user_formation_assignments.formation_id
          AND s.instructor_id = auth.uid()
      )
    );
  END IF;
END $$;
