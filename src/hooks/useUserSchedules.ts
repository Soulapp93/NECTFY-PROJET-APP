import { useState, useEffect } from 'react';
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
  
  // Extraire les IDs de formation depuis les données utilisateur
  const formationIds = userFormations?.map(uf => uf.formation_id) || [];

  const fetchSchedules = async () => {
    // Les tuteurs utilisent useTutorSchedules, pas ce hook
    if (!userId || !userRole || userRole === 'Tuteur') {
      setSchedules([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let data: ScheduleSlot[] = [];

      if (userRole === 'Étudiant') {
        // Pour les étudiants : récupérer les emplois du temps des formations auxquelles ils sont inscrits
        if (formationIds.length > 0) {
          data = await scheduleService.getStudentSchedules(formationIds);
        } else {
          // Si pas de formations trouvées, afficher tous les emplois du temps publiés (fallback)
          data = await scheduleService.getAllPublishedSchedules();
        }
      } else if (userRole === 'Formateur' || userRole === 'Tuteur') {
        // Pour les formateurs/tuteurs : récupérer tous les cours auxquels ils sont assignés
        data = await scheduleService.getInstructorSchedules(userId);
      } else if (userRole === 'Admin' || userRole === 'AdminPrincipal') {
        // Pour les administrateurs : voir tous les emplois du temps publiés
        data = await scheduleService.getAllPublishedSchedules();
      }

      setSchedules(data || []);
    } catch (err) {
      console.error('fetchSchedules - Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userRole) {
      fetchSchedules();
    }
  }, [userId, userRole, userFormations]);

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    if (!userId || !userRole) return;

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
          // Rafraîchir les données quand un créneau change
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
          // Rafraîchir les données quand un emploi du temps change
          fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      slotsSubscription.unsubscribe();
      schedulesSubscription.unsubscribe();
    };
  }, [userId, userRole, userFormations]);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules
  };
};
