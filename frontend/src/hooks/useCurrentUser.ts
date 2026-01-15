import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Nettoyer toute ancienne session démo au démarrage
    sessionStorage.removeItem('demo_user');
    
    const fetchUserRole = async (uid: string) => {
      try {
        // Utiliser la fonction SQL (SECURITY DEFINER) pour éviter les problèmes RLS côté client
        const { data, error } = await supabase.rpc('get_current_user_role');

        if (!mounted) return;

        if (error) {
          console.error('Erreur lors de la récupération du rôle (rpc get_current_user_role):', error);
          setUserRole(null);
          return;
        }

        setUserRole(data ?? null);
      } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error);
        if (mounted) setUserRole(null);
      }
    };

    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          await fetchUserRole(session.user.id);
        } else {
          setUserId(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        if (mounted) {
          setUserId(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          // Déférer le fetch pour éviter les deadlocks
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user.id).finally(() => {
                if (mounted) setLoading(false);
              });
            }
          }, 0);
        } else {
          setUserId(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    getCurrentUser();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userId, userRole, loading };
};

// Créer un hook pour récupérer les informations utilisateur avec tuteur/apprenti
export const useUserWithRelations = () => {
  const { userId, userRole, loading: userLoading } = useCurrentUser();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [relationInfo, setRelationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchUserRelations = async () => {
      if (!userId) {
        if (mounted) {
          setUserInfo(null);
          setRelationInfo(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Pour les tuteurs, on évite les SELECT directs sur tutors (RLS en erreur) et on s'appuie
        // sur les infos de session + RPCs SECURITY DEFINER.
        if (userRole === 'Tuteur') {
          const { data: sessionData } = await supabase.auth.getSession();
          const u = sessionData.session?.user;

          if (!mounted) return;

          setUserInfo({
            id: userId,
            email: u?.email ?? null,
            first_name: (u?.user_metadata as any)?.first_name ?? null,
            last_name: (u?.user_metadata as any)?.last_name ?? null,
            phone: (u?.user_metadata as any)?.phone ?? null,
            profile_photo_url: (u?.user_metadata as any)?.profile_photo_url ?? null,
            role: 'Tuteur',
          });

          // Chercher l'apprenti du tuteur via RPC pour éviter RLS
          const { data: studentIds, error: studentIdsError } = await supabase.rpc('get_tutor_students', {
            _tutor_id: userId,
          });

          if (!mounted) return;

          const firstStudentId = Array.isArray(studentIds) ? studentIds[0] : null;

          if (!studentIdsError && firstStudentId) {
            const { data: studentData } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', firstStudentId)
              .maybeSingle();

            if (!mounted) return;

            if (studentData) {
              setRelationInfo({
                type: 'student',
                name: `${studentData.first_name} ${studentData.last_name}`,
              });
            } else {
              setRelationInfo(null);
            }
          } else {
            setRelationInfo(null);
          }

          return;
        }

        // Pour les autres rôles, récupérer depuis la table users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!mounted) return;

        if (userError) {
          console.error('Erreur lors de la récupération des infos utilisateur:', userError);
          setUserInfo(null);
        } else {
          setUserInfo(userData ?? null);
        }

        // Si c'est un étudiant, chercher son tuteur (via la vue)
        if (userRole === 'Étudiant') {
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutor_students_view')
            .select('*')
            .eq('student_id', userId)
            .eq('is_active', true)
            .maybeSingle();

          if (!mounted) return;

          if (!tutorError && tutorData) {
            setRelationInfo({
              type: 'tutor',
              name: `${tutorData.tutor_first_name} ${tutorData.tutor_last_name}`,
              company: tutorData.company_name,
              position: tutorData.position,
            });
          } else {
            setRelationInfo(null);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des relations:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserRelations();
    
    return () => {
      mounted = false;
    };
  }, [userId, userRole]);

  return { userInfo, relationInfo, loading: loading || userLoading };
};
