import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformRole {
  role: 'super_admin' | 'blog_editor' | 'seo_manager' | 'analytics_viewer';
}

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canManageBlog, setCanManageBlog] = useState(false);
  const [canViewAnalytics, setCanViewAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [platformRoles, setPlatformRoles] = useState<PlatformRole[]>([]);

  useEffect(() => {
    checkPlatformRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPlatformRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPlatformRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsSuperAdmin(false);
        setCanManageBlog(false);
        setCanViewAnalytics(false);
        setPlatformRoles([]);
        setLoading(false);
        return;
      }

      // IMPORTANT: utiliser des RPC côté backend (SECURITY DEFINER) plutôt que
      // lire directement la table `platform_user_roles` (qui peut être bloquée par RLS).
      const [{ data: isSA, error: isSuperAdminError }, { data: canManageBlogData, error: canManageBlogError }] =
        await Promise.all([
          supabase.rpc('is_super_admin'),
          supabase.rpc('can_manage_blog'),
        ]);

      if (isSuperAdminError) {
        console.error('Error checking is_super_admin:', isSuperAdminError);
      }
      if (canManageBlogError) {
        console.error('Error checking can_manage_blog:', canManageBlogError);
      }

      const superAdmin = !!isSA;
      const manageBlog = !!canManageBlogData;

      setIsSuperAdmin(superAdmin);
      setCanManageBlog(manageBlog);
      // Pour l’instant, on conserve le comportement existant : analytics seulement si Super Admin.
      setCanViewAnalytics(superAdmin);

      // `platformRoles` devient non critique pour l'UI ; on le garde vide pour éviter les faux positifs.
      setPlatformRoles(superAdmin ? [{ role: 'super_admin' }] : []);
    } catch (error) {
      console.error('Error in checkPlatformRoles:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isSuperAdmin,
    canManageBlog,
    canViewAnalytics,
    platformRoles,
    loading,
    refresh: checkPlatformRoles
  };
}
