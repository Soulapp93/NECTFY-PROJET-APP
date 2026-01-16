import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { scheduleService, ScheduleSlot } from '@/services/scheduleService';
import { useCurrentUser } from './useCurrentUser';
import { useUserFormations } from './useUserFormations';
import { supabase } from '@/integrations/supabase/client';

export const useUserSchedules = () => {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { userId, userRole } = useCurrentUser();
  const { userFormations } = useUserFormations();
  
  // Mémoriser les IDs de formation pour éviter les re-renders inutiles
  const formationIds = useMemo(() => {
    return userFormations?.map(uf => uf.formation_id) || [];
  }, [userFormations]);
  
  // Utiliser une ref pour éviter les appels dupliqués
  const fetchingRef = useRef(false);
  const lastFetchParamsRef = useRef<string>('');

  const fetchSchedules = useCallback(async () => {
    // Les tuteurs utilisent useTutorSchedules, pas ce hook
    if (!userId || !userRole || userRole === 'Tuteur') {
      setSchedules([]);
      return;
    }

    // Créer une clé unique pour les paramètres actuels
    const fetchParams = `${userId}-${userRole}-${formationIds.join(',')}`;
    
    // Éviter les appels dupliqués avec les mêmes paramètres
    if (fetchingRef.current || lastFetchParamsRef.current === fetchParams) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      let data: ScheduleSlot[] = [];

      if (userRole === 'Étudiant') {
        // Pour les étudiants : récupérer les emplois du temps des formations auxquelles ils sont inscrits
        if (formationIds.length > 0) {
          data = await scheduleService.getStudentSchedules(formationIds);
        } else {
          // Si pas de formations trouvées, ne rien afficher
          data = [];
        }
      } else if (userRole === 'Formateur') {
        // Pour les formateurs : récupérer tous les cours auxquels ils sont assignés
        data = await scheduleService.getInstructorSchedules(userId);
      } else if (userRole === 'Admin' || userRole === 'AdminPrincipal') {
        // Pour les administrateurs : voir tous les emplois du temps publiés
        data = await scheduleService.getAllPublishedSchedules();
      }

      lastFetchParamsRef.current = fetchParams;
      setSchedules(data || []);
    } catch (err) {
      console.error('fetchSchedules - Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [userId, userRole, formationIds]);

  // Effet pour charger les données initiales
  useEffect(() => {
    if (userId && userRole && userRole !== 'Tuteur') {
      fetchSchedules();
    }
  }, [fetchSchedules]);

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    if (!userId || !userRole || userRole === 'Tuteur') return;

    // S'abonner aux changements sur schedule_slots
    const slotsSubscription = supabase
      .channel('schedule_slots_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_slots'
        },
        () => {
          // Réinitialiser le dernier fetch pour forcer un nouveau chargement
          lastFetchParamsRef.current = '';
          fetchSchedules();
        }
      )
      .subscribe();

    // S'abonner aux changements sur schedules
    const schedulesSubscription = supabase
      .channel('schedules_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules'
        },
        () => {
          lastFetchParamsRef.current = '';
          fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      slotsSubscription.unsubscribe();
      schedulesSubscription.unsubscribe();
    };
  }, [userId, userRole, fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refetch: () => {
      lastFetchParamsRef.current = '';
      return fetchSchedules();
    }
  };
};
