import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserTutor {
  tutor_id: string;
  tutor_first_name: string;
  tutor_last_name: string;
  tutor_email: string;
  company_name: string;
  position?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
}

export const useUserTutors = () => {
  const [userTutors, setUserTutors] = useState<Record<string, UserTutor[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTutors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('tutor_students_view')
        .select('*');

      if (error) throw error;

      // Grouper par student_id
      const tutorsByStudent = data?.reduce((acc, item) => {
        if (!item.student_id) return acc;
        
        if (!acc[item.student_id]) {
          acc[item.student_id] = [];
        }
        
        acc[item.student_id].push({
          tutor_id: item.tutor_id,
          tutor_first_name: item.tutor_first_name,
          tutor_last_name: item.tutor_last_name,
          tutor_email: item.tutor_email,
          company_name: item.company_name,
          position: item.position,
          contract_type: item.contract_type,
          contract_start_date: item.contract_start_date,
          contract_end_date: item.contract_end_date,
        });
        
        return acc;
      }, {} as Record<string, UserTutor[]>) || {};

      setUserTutors(tutorsByStudent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tuteurs');
    } finally {
      setLoading(false);
    }
  };

  const getUserTutors = (userId: string): UserTutor[] => {
    return userTutors[userId] || [];
  };

  useEffect(() => {
    fetchUserTutors();
  }, []);

  return {
    userTutors,
    loading,
    error,
    getUserTutors,
    refetch: fetchUserTutors
  };
};