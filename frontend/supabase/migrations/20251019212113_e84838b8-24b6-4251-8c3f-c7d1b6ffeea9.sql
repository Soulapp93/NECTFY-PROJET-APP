-- D'abord supprimer les politiques qui dépendent de la fonction
DROP POLICY IF EXISTS "Admins can create users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Maintenant on peut supprimer la fonction
DROP FUNCTION IF EXISTS public.is_current_user_admin() CASCADE;

-- Recréer la fonction améliorée
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  -- Si l'utilisateur existe et est admin, retourner true
  IF user_role = 'Admin' THEN
    RETURN true;
  END IF;
  
  -- Sinon retourner false
  RETURN false;
END;
$$;

-- Recréer les politiques améliorées
CREATE POLICY "Admins can create users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);

CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'Admin'
  )
);