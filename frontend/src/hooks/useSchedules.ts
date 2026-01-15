import { useState, useEffect } from 'react';
import { scheduleService, Schedule } from '@/services/scheduleService';
import { supabase } from '@/integrations/supabase/client';

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleService.getSchedules();
      setSchedules(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Synchronisation en temps réel avec Supabase
  useEffect(() => {
    // S'abonner aux changements sur schedules
    const schedulesSubscription = supabase
      .channel('admin_schedules_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules'
        },
        () => {
          fetchSchedules();
        }
      )
      .subscribe();

    // S'abonner aux changements sur schedule_slots
    const slotsSubscription = supabase
      .channel('admin_slots_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_slots'
        },
        () => {
          fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      schedulesSubscription.unsubscribe();
      slotsSubscription.unsubscribe();
    };
  }, []);

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules
  };
};