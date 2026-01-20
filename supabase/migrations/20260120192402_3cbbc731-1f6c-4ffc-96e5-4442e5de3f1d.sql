-- Créer une fonction RPC SECURITY DEFINER qui retourne tout le contexte utilisateur
CREATE OR REPLACE FUNCTION public.get_my_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
  v_user_data jsonb;
  v_relation_data jsonb;
  v_establishment_data jsonb;
  v_role text;
  v_is_tutor boolean := false;
BEGIN
  -- Récupérer l'ID de l'utilisateur connecté
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Vérifier d'abord si c'est un tuteur (table tutors)
  SELECT jsonb_build_object(
    'id', t.id,
    'email', t.email,
    'first_name', t.first_name,
    'last_name', t.last_name,
    'phone', t.phone,
    'profile_photo_url', t.profile_photo_url,
    'role', 'Tuteur',
    'company_name', t.company_name,
    'position', t.position,
    'establishment_id', t.establishment_id
  )
  INTO v_user_data
  FROM tutors t
  WHERE t.id = v_user_id;

  IF v_user_data IS NOT NULL THEN
    v_is_tutor := true;
    v_role := 'Tuteur';
    
    -- Récupérer l'apprenti du tuteur
    SELECT jsonb_build_object(
      'type', 'student',
      'id', u.id,
      'name', u.first_name || ' ' || u.last_name,
      'email', u.email
    )
    INTO v_relation_data
    FROM tutor_student_assignments tsa
    JOIN users u ON u.id = tsa.student_id
    WHERE tsa.tutor_id = v_user_id
      AND tsa.is_active = true
    LIMIT 1;
  ELSE
    -- Sinon, récupérer depuis la table users
    SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'phone', u.phone,
      'profile_photo_url', u.profile_photo_url,
      'role', u.role,
      'establishment_id', u.establishment_id
    )
    INTO v_user_data
    FROM users u
    WHERE u.id = v_user_id;

    IF v_user_data IS NOT NULL THEN
      v_role := v_user_data->>'role';
      
      -- Si c'est un étudiant, récupérer son tuteur
      IF v_role = 'Étudiant' THEN
        SELECT jsonb_build_object(
          'type', 'tutor',
          'id', t.id,
          'name', t.first_name || ' ' || t.last_name,
          'email', t.email,
          'company', t.company_name,
          'position', t.position
        )
        INTO v_relation_data
        FROM tutor_student_assignments tsa
        JOIN tutors t ON t.id = tsa.tutor_id
        WHERE tsa.student_id = v_user_id
          AND tsa.is_active = true
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  -- Récupérer les infos de l'établissement
  IF v_user_data IS NOT NULL AND v_user_data->>'establishment_id' IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', e.id,
      'name', e.name,
      'logo_url', e.logo_url
    )
    INTO v_establishment_data
    FROM establishments e
    WHERE e.id = (v_user_data->>'establishment_id')::uuid;
  END IF;

  -- Construire le résultat final
  v_result := jsonb_build_object(
    'user', COALESCE(v_user_data, 'null'::jsonb),
    'relation', COALESCE(v_relation_data, 'null'::jsonb),
    'establishment', COALESCE(v_establishment_data, 'null'::jsonb),
    'role', COALESCE(v_role, null)
  );

  RETURN v_result;
END;
$$;

-- Accorder les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.get_my_context() TO authenticated;