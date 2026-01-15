-- =============================================
-- CORRECTION DES VULNÉRABILITÉS RLS CRITIQUES
-- =============================================

-- 1. SÉCURISATION DE LA TABLE USERS
-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "View establishment users" ON public.users;

-- Policy : Les utilisateurs voient uniquement leur propre profil
CREATE POLICY "Users view own profile"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Policy : Les admins voient tous les utilisateurs de leur établissement
CREATE POLICY "Admins view establishment users"
ON public.users
FOR SELECT
USING (
  (establishment_id = get_current_user_establishment()) 
  AND (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
);

-- Policy : Les formateurs voient les étudiants de leurs formations
CREATE POLICY "Instructors view formation students"
ON public.users
FOR SELECT
USING (
  (get_current_user_role() = 'Formateur'::text)
  AND (id IN (
    SELECT ufa.user_id 
    FROM user_formation_assignments ufa
    JOIN module_instructors mi ON mi.module_id IN (
      SELECT fm.id FROM formation_modules fm WHERE fm.formation_id = ufa.formation_id
    )
    WHERE mi.instructor_id = auth.uid()
  ))
);

-- Policy : Les étudiants voient les autres étudiants de leurs formations (noms seulement via la formation)
CREATE POLICY "Students view classmates basic info"
ON public.users
FOR SELECT
USING (
  (get_current_user_role() = 'Apprenant'::text)
  AND (id IN (
    SELECT ufa2.user_id 
    FROM user_formation_assignments ufa1
    JOIN user_formation_assignments ufa2 ON ufa1.formation_id = ufa2.formation_id
    WHERE ufa1.user_id = auth.uid()
  ))
);

-- 2. SÉCURISATION DE LA TABLE TUTORS
-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "View establishment tutors" ON public.tutors;

-- Policy : Les admins voient tous les tuteurs de leur établissement
CREATE POLICY "Admins view establishment tutors"
ON public.tutors
FOR SELECT
USING (
  (establishment_id = get_current_user_establishment()) 
  AND (get_current_user_role() = ANY (ARRAY['Admin'::text, 'AdminPrincipal'::text]))
);

-- Policy : Les étudiants voient uniquement leur tuteur assigné
CREATE POLICY "Students view assigned tutor"
ON public.tutors
FOR SELECT
USING (
  id IN (
    SELECT tsa.tutor_id 
    FROM tutor_student_assignments tsa 
    WHERE tsa.student_id = auth.uid() 
    AND tsa.is_active = true
  )
);

-- Policy : Les tuteurs voient leur propre profil (via leur email)
CREATE POLICY "Tutors view own profile"
ON public.tutors
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);