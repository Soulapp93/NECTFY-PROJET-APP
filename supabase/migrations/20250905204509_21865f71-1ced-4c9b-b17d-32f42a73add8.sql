-- Supprimer les policies problématiques qui causent une récursion infinie
DROP POLICY IF EXISTS "Admins can view all users in establishment" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users in establishment" ON public.users;
DROP POLICY IF EXISTS "Instructors can view assigned students" ON public.users;
DROP POLICY IF EXISTS "Allow all for development users" ON public.users;

-- Créer une fonction security definer pour vérifier le rôle utilisateur sans récursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Créer une fonction security definer pour obtenir l'establishment_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_current_user_establishment()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT establishment_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Policy simplifiée pour permettre l'accès pendant le développement
CREATE POLICY "Development access for users" 
ON public.users 
FOR ALL 
USING (true);

-- Policy pour permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy pour permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);