import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface TutorStudent {
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  formation_title?: string;
  formation_level?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  is_active?: boolean;
}

export const useTutorStudents = () => {
  const [allTutorStudents, setAllTutorStudents] = useState<Record<string, TutorStudent[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { establishmentId } = useCurrentUser();

  const fetchAllTutorStudents = async () => {
    if (!establishmentId) {
      setAllTutorStudents({});
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('tutor_students_view')
        .select('*')
        .eq('tutor_establishment_id', establishmentId);

      if (error) throw error;

      // Grouper par tutor_id
      const studentsByTutor = data?.reduce((acc, item) => {
        if (!item.tutor_id || !item.student_id) return acc;
        
        if (!acc[item.tutor_id]) {
          acc[item.tutor_id] = [];
        }
        
        acc[item.tutor_id].push({
          student_id: item.student_id,
          student_first_name: item.student_first_name,
          student_last_name: item.student_last_name,
          student_email: item.student_email,
          formation_title: item.formation_title,
          formation_level: item.formation_level,
          contract_type: item.contract_type,
          contract_start_date: item.contract_start_date,
          contract_end_date: item.contract_end_date,
          is_active: item.assignment_active,
        });
        
        return acc;
      }, {} as Record<string, TutorStudent[]>) || {};

      setAllTutorStudents(studentsByTutor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des apprentis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTutorStudents();
  }, [establishmentId]);

  const getTutorStudents = (tutorId: string): TutorStudent[] => {
    return allTutorStudents[tutorId] || [];
  };

  return {
    allTutorStudents,
    loading,
    error,
    getTutorStudents,
    refetch: fetchAllTutorStudents
  };
};
