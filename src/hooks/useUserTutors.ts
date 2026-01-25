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
      
      // Fetch tutor-student assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('tutor_student_assignments')
        .select('*')
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;
      if (!assignments) {
        setUserTutors({});
        return;
      }

      // Fetch tutor details for each assignment
      const tutorsByStudent: Record<string, UserTutor[]> = {};

      for (const assignment of assignments) {
        // Fetch tutor info
        const { data: tutor } = await supabase
          .from('tutors')
          .select('first_name, last_name, email, company_name, position')
          .eq('id', assignment.tutor_id)
          .single();

        if (!tutor) continue;

        if (!tutorsByStudent[assignment.student_id]) {
          tutorsByStudent[assignment.student_id] = [];
        }

        tutorsByStudent[assignment.student_id].push({
          tutor_id: assignment.tutor_id,
          tutor_first_name: tutor.first_name,
          tutor_last_name: tutor.last_name,
          tutor_email: tutor.email,
          company_name: tutor.company_name || '',
          position: tutor.position || undefined
        });
      }

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
