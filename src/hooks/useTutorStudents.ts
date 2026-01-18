import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TutorStudent {
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  is_active?: boolean;
  formation_title?: string;
  formation_level?: string;
}

export const useTutorStudents = () => {
  const [tutorStudents, setTutorStudents] = useState<Record<string, TutorStudent[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('tutor_students_view')
        .select('*')
        .not('student_id', 'is', null);

      if (error) throw error;

      // Grouper par tutor_id
      const studentsByTutor = data?.reduce((acc, item) => {
        if (!item.tutor_id) return acc;
        
        if (!acc[item.tutor_id]) {
          acc[item.tutor_id] = [];
        }
        
        // Éviter les doublons
        const exists = acc[item.tutor_id].some((s: TutorStudent) => s.student_id === item.student_id);
        if (!exists && item.student_id) {
          acc[item.tutor_id].push({
            student_id: item.student_id,
            student_first_name: item.student_first_name,
            student_last_name: item.student_last_name,
            student_email: item.student_email,
            contract_type: item.contract_type,
            contract_start_date: item.contract_start_date,
            contract_end_date: item.contract_end_date,
            is_active: item.is_active,
            formation_title: item.formation_title,
            formation_level: item.formation_level,
          });
        }
        
        return acc;
      }, {} as Record<string, TutorStudent[]>) || {};

      setTutorStudents(studentsByTutor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const getTutorStudents = (tutorId: string): TutorStudent[] => {
    return tutorStudents[tutorId] || [];
  };

  useEffect(() => {
    fetchTutorStudents();
  }, []);

  return {
    tutorStudents,
    loading,
    error,
    getTutorStudents,
    refetch: fetchTutorStudents
  };
};
