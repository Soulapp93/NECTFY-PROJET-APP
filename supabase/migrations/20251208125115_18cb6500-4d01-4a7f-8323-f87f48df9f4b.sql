-- =====================================================
-- MIGRATION DE SÉCURITÉ: Correction des failles RLS critiques
-- =====================================================

-- 1. Supprimer la politique dangereuse "Public can create first admin" sur users
DROP POLICY IF EXISTS "Public can create first admin" ON public.users;

-- 2. Corriger la politique sur user_activation_tokens 
DROP POLICY IF EXISTS "Users can view own tokens" ON public.user_activation_tokens;

-- Créer politique restrictive (éviter doublon)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_activation_tokens' 
    AND policyname = 'Users view own activation tokens'
  ) THEN
    EXECUTE 'CREATE POLICY "Users view own activation tokens" ON public.user_activation_tokens FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 3. Sécuriser user_signatures si politique manquante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_signatures' 
    AND policyname = 'Users manage own signatures'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users manage signatures" ON public.user_signatures';
    EXECUTE 'CREATE POLICY "Users manage own signatures" ON public.user_signatures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- 4. Sécuriser tutor_student_assignments si politiques manquantes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tutor_student_assignments' 
    AND policyname = 'Tutors view own assignments'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Tutors view assignments" ON public.tutor_student_assignments';
    EXECUTE 'CREATE POLICY "Tutors view own assignments" ON public.tutor_student_assignments FOR SELECT USING (tutor_id IN (SELECT t.id FROM tutors t WHERE t.establishment_id = get_current_user_establishment()))';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tutor_student_assignments' 
    AND policyname = 'Admins manage tutor assignments'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins manage tutor assignments" ON public.tutor_student_assignments FOR ALL USING (get_current_user_role() = ANY (ARRAY[''Admin''::text, ''AdminPrincipal''::text]) AND tutor_id IN (SELECT t.id FROM tutors t WHERE t.establishment_id = get_current_user_establishment()))';
  END IF;
END $$;

-- 5. Activer RLS sur tutor_student_assignments si pas déjà fait
ALTER TABLE public.tutor_student_assignments ENABLE ROW LEVEL SECURITY;