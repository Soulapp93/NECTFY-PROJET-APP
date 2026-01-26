-- Add group_type column to chat_groups to identify establishment groups
ALTER TABLE public.chat_groups ADD COLUMN IF NOT EXISTS group_type text DEFAULT 'custom';

-- Update existing establishment groups
UPDATE public.chat_groups SET group_type = 'establishment' WHERE name LIKE '%- Général';

-- Drop problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Manage group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "View group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Join groups" ON public.chat_group_members;

-- Create a security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.is_member_of_group(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Create a security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_group_members
    WHERE user_id = _user_id AND group_id = _group_id AND role = 'admin'
  )
$$;

-- Create a function to get establishment group id
CREATE OR REPLACE FUNCTION public.get_establishment_group_id(_establishment_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.chat_groups 
  WHERE establishment_id = _establishment_id AND group_type = 'establishment'
  LIMIT 1
$$;

-- New RLS policies for chat_group_members without recursion
CREATE POLICY "View establishment group members"
ON public.chat_group_members FOR SELECT
USING (
  group_id IN (
    SELECT id FROM public.chat_groups 
    WHERE establishment_id = get_current_user_establishment()
  )
);

CREATE POLICY "Admins manage group members"
ON public.chat_group_members FOR ALL
USING (is_current_user_admin());

CREATE POLICY "Users join establishment groups"
ON public.chat_group_members FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  group_id IN (
    SELECT id FROM public.chat_groups 
    WHERE establishment_id = get_current_user_establishment() AND group_type = 'establishment'
  )
);

-- Create trigger function to auto-add users to establishment group
CREATE OR REPLACE FUNCTION public.auto_join_establishment_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  -- Get the establishment group
  SELECT id INTO v_group_id 
  FROM public.chat_groups 
  WHERE establishment_id = NEW.establishment_id AND group_type = 'establishment'
  LIMIT 1;
  
  IF v_group_id IS NOT NULL THEN
    -- Check if not already a member
    IF NOT EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = v_group_id AND user_id = NEW.id) THEN
      INSERT INTO public.chat_group_members (group_id, user_id, role)
      VALUES (v_group_id, NEW.id, 'member');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for users table
DROP TRIGGER IF EXISTS trigger_auto_join_establishment_group ON public.users;
CREATE TRIGGER trigger_auto_join_establishment_group
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_join_establishment_group();

-- Create similar trigger for tutors table
CREATE OR REPLACE FUNCTION public.auto_join_establishment_group_tutor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  -- Get the establishment group
  SELECT id INTO v_group_id 
  FROM public.chat_groups 
  WHERE establishment_id = NEW.establishment_id AND group_type = 'establishment'
  LIMIT 1;
  
  IF v_group_id IS NOT NULL THEN
    -- Check if not already a member
    IF NOT EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = v_group_id AND user_id = NEW.id) THEN
      INSERT INTO public.chat_group_members (group_id, user_id, role)
      VALUES (v_group_id, NEW.id, 'member');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_join_establishment_group_tutor ON public.tutors;
CREATE TRIGGER trigger_auto_join_establishment_group_tutor
AFTER INSERT ON public.tutors
FOR EACH ROW
EXECUTE FUNCTION public.auto_join_establishment_group_tutor();

-- Add existing users to their establishment groups
INSERT INTO public.chat_group_members (group_id, user_id, role)
SELECT cg.id, u.id, 'member'
FROM public.users u
JOIN public.chat_groups cg ON cg.establishment_id = u.establishment_id AND cg.group_type = 'establishment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_group_members cgm 
  WHERE cgm.group_id = cg.id AND cgm.user_id = u.id
);

-- Add existing tutors to their establishment groups
INSERT INTO public.chat_group_members (group_id, user_id, role)
SELECT cg.id, t.id, 'member'
FROM public.tutors t
JOIN public.chat_groups cg ON cg.establishment_id = t.establishment_id AND cg.group_type = 'establishment'
WHERE NOT EXISTS (
  SELECT 1 FROM public.chat_group_members cgm 
  WHERE cgm.group_id = cg.id AND cgm.user_id = t.id
);