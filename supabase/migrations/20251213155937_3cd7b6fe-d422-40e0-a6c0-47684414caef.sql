-- Modifier la fonction get_current_user_establishment pour également supporter les tuteurs
CREATE OR REPLACE FUNCTION public.get_current_user_establishment()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_establishment_id uuid;
BEGIN
  -- D'abord vérifier dans la table users
  SELECT establishment_id INTO user_establishment_id FROM public.users WHERE id = auth.uid();
  
  -- Si non trouvé, vérifier dans la table tutors
  IF user_establishment_id IS NULL THEN
    SELECT establishment_id INTO user_establishment_id FROM public.tutors WHERE id = auth.uid();
  END IF;
  
  RETURN user_establishment_id;
END;
$function$;

-- Modifier la fonction get_current_user_role pour également supporter les tuteurs
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- D'abord vérifier si c'est un tuteur
  IF EXISTS (SELECT 1 FROM public.tutors WHERE id = auth.uid()) THEN
    RETURN 'Tuteur';
  END IF;
  
  -- Sinon, récupérer le rôle depuis la table users
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$function$;