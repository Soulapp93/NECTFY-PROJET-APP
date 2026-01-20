-- Créer une fonction RPC pour récupérer les formations de l'apprenti assigné au tuteur
CREATE OR REPLACE FUNCTION public.get_tutor_apprentice_formations()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tutor_id uuid;
  v_apprentice_id uuid;
  v_result json;
BEGIN
  -- Récupérer l'ID du tuteur connecté
  v_tutor_id := auth.uid();
  
  IF v_tutor_id IS NULL THEN
    RETURN json_build_object('error', 'Non authentifié', 'formations', '[]'::json);
  END IF;
  
  -- Vérifier si l'utilisateur est bien un tuteur
  IF NOT EXISTS (SELECT 1 FROM tutors WHERE id = v_tutor_id) THEN
    RETURN json_build_object('error', 'Utilisateur non tuteur', 'formations', '[]'::json);
  END IF;
  
  -- Récupérer l'apprenti assigné au tuteur
  SELECT student_id INTO v_apprentice_id
  FROM tutor_student_assignments
  WHERE tutor_id = v_tutor_id AND is_active = true
  LIMIT 1;
  
  IF v_apprentice_id IS NULL THEN
    RETURN json_build_object('error', null, 'formations', '[]'::json, 'apprentice_id', null);
  END IF;
  
  -- Récupérer les formations de l'apprenti avec tous les détails
  SELECT json_build_object(
    'error', null,
    'apprentice_id', v_apprentice_id,
    'formations', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', f.id,
          'title', f.title,
          'description', f.description,
          'level', f.level,
          'status', f.status,
          'start_date', f.start_date,
          'end_date', f.end_date,
          'duration', f.duration,
          'color', f.color,
          'max_students', f.max_students,
          'modules', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', fm.id,
                'title', fm.title,
                'description', fm.description,
                'duration_hours', fm.duration_hours,
                'order_index', fm.order_index
              ) ORDER BY fm.order_index
            ), '[]'::json)
            FROM formation_modules fm
            WHERE fm.formation_id = f.id
          ),
          'student', json_build_object(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'email', u.email
          )
        )
      )
      FROM user_formation_assignments ufa
      JOIN formations f ON f.id = ufa.formation_id
      JOIN users u ON u.id = ufa.user_id
      WHERE ufa.user_id = v_apprentice_id
      ), '[]'::json
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_tutor_apprentice_formations() TO authenticated;