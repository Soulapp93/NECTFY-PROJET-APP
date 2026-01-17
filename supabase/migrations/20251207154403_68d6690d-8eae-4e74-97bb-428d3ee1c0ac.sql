-- Add AdminPrincipal role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'AdminPrincipal';

-- Update RLS policy function to recognize AdminPrincipal as admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  -- AdminPrincipal and Admin both have admin privileges
  IF user_role IN ('Admin', 'AdminPrincipal') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;