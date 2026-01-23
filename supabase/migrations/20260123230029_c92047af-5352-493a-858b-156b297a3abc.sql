-- ====================
-- FIX: Améliorer les politiques RLS pour permettre aux formateurs de voir leur propre profil
-- ====================

-- 1. Corriger la politique "Instructors view formation students" qui utilise 'Formateur'
-- mais n'inclut pas la possibilité de voir son propre profil
DROP POLICY IF EXISTS "Instructors view formation students" ON public.users;

-- 2. Créer une politique claire pour que tous les utilisateurs authentifiés puissent voir leur propre profil
-- (même si cela existe déjà, on s'assure qu'elle est correcte)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 3. Recréer la politique pour les formateurs qui peuvent voir les étudiants de leurs formations
CREATE POLICY "Instructors view formation students"
ON public.users
FOR SELECT
TO authenticated
USING (
  (get_current_user_role() = 'Formateur') 
  AND (
    -- Le formateur peut toujours voir son propre profil
    id = auth.uid()
    OR 
    -- Ou les étudiants des formations où il enseigne
    id IN (
      SELECT ufa.user_id
      FROM user_formation_assignments ufa
      JOIN module_instructors mi ON mi.module_id IN (
        SELECT fm.id FROM formation_modules fm WHERE fm.formation_id = ufa.formation_id
      )
      WHERE mi.instructor_id = auth.uid()
    )
  )
);

-- 4. Corriger la politique pour les étudiants (utilise 'Apprenant' au lieu de 'Étudiant')
DROP POLICY IF EXISTS "Students view classmates basic info" ON public.users;
CREATE POLICY "Students view classmates basic info"
ON public.users
FOR SELECT
TO authenticated
USING (
  (get_current_user_role() = 'Étudiant') 
  AND (
    id = auth.uid()
    OR id IN (
      SELECT ufa2.user_id
      FROM user_formation_assignments ufa1
      JOIN user_formation_assignments ufa2 ON ufa1.formation_id = ufa2.formation_id
      WHERE ufa1.user_id = auth.uid()
    )
  )
);

-- 5. Créer une fonction RPC SECURITY DEFINER pour obtenir le profil utilisateur courant
-- Cette fonction contourne les RLS et permet à tout utilisateur connecté de voir son profil
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Essayer d'abord la table tutors
  SELECT jsonb_build_object(
    'id', t.id,
    'email', t.email,
    'first_name', t.first_name,
    'last_name', t.last_name,
    'phone', t.phone,
    'profile_photo_url', t.profile_photo_url,
    'role', 'Tuteur',
    'status', CASE WHEN t.is_activated THEN 'Actif' ELSE 'En attente' END,
    'establishment_id', t.establishment_id,
    'is_activated', t.is_activated
  )
  INTO v_result
  FROM tutors t
  WHERE t.id = v_user_id;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Sinon, récupérer depuis la table users
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'first_name', u.first_name,
    'last_name', u.last_name,
    'phone', u.phone,
    'profile_photo_url', u.profile_photo_url,
    'role', u.role,
    'status', u.status,
    'establishment_id', u.establishment_id,
    'is_activated', u.is_activated
  )
  INTO v_result
  FROM users u
  WHERE u.id = v_user_id;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'User not found'));
END;
$$;

-- 6. Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 7. Supprimer les politiques en double qui utilisent 'public' role au lieu de 'authenticated'
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins view establishment users" ON public.users;