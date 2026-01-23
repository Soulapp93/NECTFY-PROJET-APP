-- Fix: allow authenticated users to call SECURITY DEFINER RPCs used by the frontend
-- Missing GRANTs can make the UI fall back to "Utilisateur" with empty profile.

-- Ensure authenticated can execute the context/profile role resolvers
GRANT EXECUTE ON FUNCTION public.get_my_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- Optional: keep anon blocked (should be default, but we make it explicit)
REVOKE EXECUTE ON FUNCTION public.get_my_context() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;
