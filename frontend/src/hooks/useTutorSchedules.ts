import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { scheduleService, ScheduleSlot } from '@/services/scheduleService';

interface TutorStudentInfo {
  studentId: string;
  studentName: string;
  formationIds: string[];
  formationTitles: string[];
}

export const useTutorSchedules = () => {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [studentInfo, setStudentInfo] = useState<TutorStudentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { userId, userRole } = useCurrentUser();

  const fetchTutorSchedules = async () => {
    if (!userId || userRole !== 'Tuteur') {
      setSchedules([]);
      setStudentInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer l'étudiant assigné au tuteur
      const { data: assignments, error: assignmentError } = await supabase
        .from('tutor_student_assignments')
        .select(`
          student_id,
          users!tutor_student_assignments_student_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('tutor_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      if (!assignments || !assignments.student_id) {
        setSchedules([]);
        setStudentInfo(null);
        return;
      }

      const studentId = assignments.student_id;
      const studentUser = assignments.users as any;
      const studentName = studentUser ? `${studentUser.first_name} ${studentUser.last_name}` : 'Apprenti';

      // 2. Récupérer les formations de l'étudiant
      const { data: studentFormations, error: formationsError } = await supabase
        .from('user_formation_assignments')
        .select(`
          formation_id,
          formations(id, title, level, color)
        `)
        .eq('user_id', studentId);

      if (formationsError) throw formationsError;

      const formationIds = studentFormations?.map(sf => sf.formation_id) || [];
      const formationTitles = studentFormations?.map(sf => (sf.formations as any)?.title || '') || [];

      setStudentInfo({
        studentId,
        studentName,
        formationIds,
        formationTitles
      });

      // 3. Récupérer les emplois du temps de ces formations
      if (formationIds.length > 0) {
        const data = await scheduleService.getStudentSchedules(formationIds);
        setSchedules(data || []);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('fetchTutorSchedules - Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && userRole === 'Tuteur') {
      fetchTutorSchedules();
    }
  }, [userId, userRole]);

  // Synchronisation en temps réel
  useEffect(() => {
    if (!userId || userRole !== 'Tuteur') return;

    const slotsSubscription = supabase
      .channel('tutor_schedule_slots_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_slots'
        },
        () => fetchTutorSchedules()
      )
      .subscribe();

    const schedulesSubscription = supabase
      .channel('tutor_schedules_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules'
        },
        () => fetchTutorSchedules()
      )
      .subscribe();

    return () => {
      slotsSubscription.unsubscribe();
      schedulesSubscription.unsubscribe();
    };
  }, [userId, userRole]);

  return {
    schedules,
    studentInfo,
    loading,
    error,
    refetch: fetchTutorSchedules
  };
};
