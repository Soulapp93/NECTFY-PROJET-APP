-- Remove the dangerous "Allow all for development" policy that exposes all user data
DROP POLICY IF EXISTS "Allow all for development" ON public.users;

-- Create secure RLS policies for the users table
-- Policy 1: Users can view their own profile data
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
USING (auth.uid()::text = id::text);

-- Policy 2: Users can update their own profile data (excluding role and establishment changes)
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (
  auth.uid()::text = id::text 
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  AND establishment_id = (SELECT establishment_id FROM public.users WHERE id = auth.uid())
);

-- Policy 3: Admins can view all users in their establishment
CREATE POLICY "Admins can view all users in establishment"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'Admin'
    AND admin_user.establishment_id = users.establishment_id
  )
);

-- Policy 4: Admins can manage all users in their establishment
CREATE POLICY "Admins can manage users in establishment"
ON public.users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'Admin'
    AND admin_user.establishment_id = users.establishment_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'Admin'
    AND admin_user.establishment_id = users.establishment_id
  )
);

-- Policy 5: Instructors can view students assigned to their formations
CREATE POLICY "Instructors can view assigned students"
ON public.users
FOR SELECT
USING (
  users.role = 'Étudiant' 
  AND EXISTS (
    SELECT 1 FROM public.users instructor
    JOIN public.module_instructors mi ON instructor.id = mi.instructor_id
    JOIN public.formation_modules fm ON mi.module_id = fm.id
    JOIN public.user_formation_assignments ufa ON fm.formation_id = ufa.formation_id
    WHERE instructor.id = auth.uid()
    AND instructor.role = 'Formateur'
    AND ufa.user_id = users.id
  )
);