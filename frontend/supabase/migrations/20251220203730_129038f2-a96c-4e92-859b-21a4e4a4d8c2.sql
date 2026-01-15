-- 1) Supprimer les sessions en double (garder la plus récente pour chaque schedule_slot_id)
DELETE FROM attendance_sheets
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY schedule_slot_id ORDER BY created_at DESC) AS rn
    FROM attendance_sheets
  ) ranked
  WHERE rn > 1
);

-- 2) Ajouter la contrainte UNIQUE pour empêcher les doublons à l'avenir
ALTER TABLE public.attendance_sheets
  ADD CONSTRAINT attendance_sheets_unique_schedule_slot UNIQUE (schedule_slot_id);

-- 3) Autoriser le formateur à voir les inscrits (student_formations) pour les formations où il a une session d'émargement
CREATE POLICY "Instructors view enrollments for their sessions"
ON public.student_formations
FOR SELECT
USING (
  (get_current_user_role() = ANY (ARRAY['Formateur'::text, 'Admin'::text, 'AdminPrincipal'::text]))
  AND EXISTS (
    SELECT 1
    FROM public.attendance_sheets s
    WHERE s.formation_id = student_formations.formation_id
      AND s.instructor_id = auth.uid()
  )
);

-- 4) Activer le temps réel sur les signatures et feuilles
ALTER TABLE public.attendance_signatures REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_sheets REPLICA IDENTITY FULL;

-- Ajouter à la publication realtime si pas déjà fait
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_signatures'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_signatures;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_sheets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sheets;
  END IF;
END $$;