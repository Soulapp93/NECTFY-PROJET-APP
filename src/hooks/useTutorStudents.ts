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

interface TutorStudentViewRow {
  id: string;
  tutor_id: string;
  student_id: string;
  is_active: boolean;
  assigned_at: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  student_photo: string | null;
}

export const useTutorStudents = () => {
  const [tutorStudents, setTutorStudents] = useState<Record<string, TutorStudent[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use RPC or direct query on tutor_student_assignments + users join
      const { data: assignments, error: assignmentError } = await supabase
        .from('tutor_student_assignments')
        .select('*')
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;
      if (!assignments) {
        setTutorStudents({});
        return;
      }

      // Fetch student details for each assignment
      const studentsByTutor: Record<string, TutorStudent[]> = {};

      for (const assignment of assignments) {
        const { data: student } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', assignment.student_id)
          .single();

        if (!student) continue;

        if (!studentsByTutor[assignment.tutor_id]) {
          studentsByTutor[assignment.tutor_id] = [];
        }

        // Avoid duplicates
        const exists = studentsByTutor[assignment.tutor_id].some(
          s => s.student_id === assignment.student_id
        );

        if (!exists) {
          studentsByTutor[assignment.tutor_id].push({
            student_id: assignment.student_id,
            student_first_name: student.first_name,
            student_last_name: student.last_name,
            student_email: student.email,
            is_active: assignment.is_active
          });
        }
      }

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
