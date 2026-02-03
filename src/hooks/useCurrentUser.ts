import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rpcWithRetry, retryQuery } from '@/lib/supabaseRetry';

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async (uid: string, mounted: { current: boolean }) => {
    try {
      // Use retry logic for transient network errors
      const { data, error: rpcError } = await rpcWithRetry(
        () => supabase.rpc('get_current_user_role'),
        {
          maxRetries: 3,
          baseDelayMs: 500,
          onRetry: (attempt, err) => {
            console.warn(`Retry attempt ${attempt} for get_current_user_role:`, err.message);
          }
        }
      );

      if (!mounted.current) return;

      if (rpcError) {
        console.error('Erreur lors de la récupération du rôle (rpc get_current_user_role):', rpcError);
        setError('Erreur de chargement du rôle');
        setUserRole(null);
        return;
      }

      setError(null);
      setUserRole((data as string) ?? null);
    } catch (err) {
      console.error('Erreur lors de la récupération du rôle après retries:', err);
      if (mounted.current) {
        setError('Erreur de connexion - veuillez rafraîchir la page');
        setUserRole(null);
      }
    }
  }, []);

  useEffect(() => {
    const mounted = { current: true };
    
    // Nettoyer toute ancienne session démo au démarrage
    sessionStorage.removeItem('demo_user');
    
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted.current) return;
        
        if (sessionError) {
          console.error('Erreur de session:', sessionError);
          setError('Erreur de session');
          setLoading(false);
          return;
        }
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          await fetchUserRole(session.user.id, mounted);
        } else {
          setUserId(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        if (mounted.current) {
          setUserId(null);
          setUserRole(null);
          setError('Erreur de connexion');
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted.current) return;
        
        if (session?.user?.id) {
          setUserId(session.user.id);
          // Déférer le fetch pour éviter les deadlocks
          setTimeout(() => {
            if (mounted.current) {
              fetchUserRole(session.user.id, mounted).finally(() => {
                if (mounted.current) setLoading(false);
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
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  return { userId, userRole, loading, error };
};

// Créer un hook pour récupérer les informations utilisateur avec tuteur/apprenti
export const useUserWithRelations = () => {
  const { userId, userRole, loading: userLoading, error: userError } = useCurrentUser();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [relationInfo, setRelationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mounted = { current: true };
    
    const fetchUserRelations = async () => {
      if (!userId) {
        if (mounted.current) {
          setUserInfo(null);
          setRelationInfo(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Pour les tuteurs, récupérer les infos depuis la table tutors et les apprentis
        if (userRole === 'Tuteur') {
          // Récupérer les infos du tuteur depuis la table tutors avec retry
          const { data: tutorData, error: tutorError } = await retryQuery(
            () => supabase
              .from('tutors')
              .select('*')
              .eq('id', userId)
              .maybeSingle(),
            { maxRetries: 2 }
          );

          if (!mounted.current) return;

          if (tutorError) {
            console.error('Erreur tutor data:', tutorError);
          }

          if (tutorData) {
            setUserInfo({
              id: userId,
              email: tutorData.email,
              first_name: tutorData.first_name,
              last_name: tutorData.last_name,
              phone: tutorData.phone,
              profile_photo_url: tutorData.profile_photo_url,
              role: 'Tuteur',
            });
          } else {
            // Fallback sur les infos de session
            const { data: sessionData } = await supabase.auth.getSession();
            const u = sessionData.session?.user;
            setUserInfo({
              id: userId,
              email: u?.email ?? null,
              first_name: (u?.user_metadata as any)?.first_name ?? null,
              last_name: (u?.user_metadata as any)?.last_name ?? null,
              phone: null,
              profile_photo_url: null,
              role: 'Tuteur',
            });
          }

          // Chercher l'apprenti du tuteur via la table tutor_student_assignments
          const { data: assignments, error: assignmentError } = await retryQuery(
            () => supabase
              .from('tutor_student_assignments')
              .select('student_id, is_active')
              .eq('tutor_id', userId)
              .eq('is_active', true)
              .limit(1),
            { maxRetries: 2 }
          );

          if (!mounted.current) return;

          if (!assignmentError && assignments && assignments.length > 0) {
            // Récupérer les détails de l'étudiant
            const { data: studentInfo } = await supabase
              .from('users')
              .select('first_name, last_name')
              .eq('id', assignments[0].student_id)
              .single();

            if (studentInfo) {
              setRelationInfo({
                type: 'student',
                name: `${studentInfo.first_name} ${studentInfo.last_name}`,
              });
            } else {
              setRelationInfo(null);
            }
          } else {
            setRelationInfo(null);
          }

          setLoading(false);
          return;
        }

        // Pour les autres rôles, récupérer depuis la table users avec retry
        const { data: userData, error: userDataError } = await retryQuery(
          () => supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          { maxRetries: 2 }
        );

        if (!mounted.current) return;

        if (userDataError) {
          console.error('Erreur lors de la récupération des infos utilisateur:', userDataError);
          setUserInfo(null);
          setError('Erreur de chargement du profil');
        } else {
          setUserInfo(userData ?? null);
          setError(null);
        }

        // Si c'est un étudiant, chercher son tuteur
        if (userRole === 'Étudiant') {
          const { data: assignments, error: assignmentError } = await retryQuery(
            () => supabase
              .from('tutor_student_assignments')
              .select('tutor_id, is_active')
              .eq('student_id', userId)
              .eq('is_active', true)
              .limit(1),
            { maxRetries: 2 }
          );

          if (!mounted.current) return;

          if (!assignmentError && assignments && assignments.length > 0) {
            // Récupérer les détails du tuteur
            const { data: tutorInfo } = await supabase
              .from('tutors')
              .select('first_name, last_name, company_name, position')
              .eq('id', assignments[0].tutor_id)
              .single();

            if (tutorInfo) {
              setRelationInfo({
                type: 'tutor',
                name: `${tutorInfo.first_name} ${tutorInfo.last_name}`,
                company: tutorInfo.company_name || undefined,
                position: tutorInfo.position || undefined,
              });
            } else {
              setRelationInfo(null);
            }
          } else {
            setRelationInfo(null);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des relations:', err);
        if (mounted.current) {
          setError('Erreur de chargement des données');
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    fetchUserRelations();
    
    return () => {
      mounted.current = false;
    };
  }, [userId, userRole]);

  return { 
    userInfo, 
    relationInfo, 
    loading: loading || userLoading,
    error: error || userError
  };
};
