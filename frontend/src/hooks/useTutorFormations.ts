import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface TutorFormation {
  formation_id: string;
  formation_title: string;
  formation_level: string;
  formation_description?: string;
  formation_start_date: string;
  formation_end_date: string;
  formation_color?: string;
  formation_duration?: number;
  modules_count?: number;
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
}

export const useTutorFormations = () => {
  const { userId, userRole } = useCurrentUser();
  const [formations, setFormations] = useState<TutorFormation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorFormations = async () => {
    if (!userId || userRole !== 'Tuteur') {
      setFormations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 1. Récupérer les étudiants assignés au tuteur
      const { data: studentAssignments, error: assignmentError } = await supabase
        .from('tutor_student_assignments')
        .select(`
          student_id,
          users!tutor_student_assignments_student_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('tutor_id', userId)
        .eq('is_active', true);
      
      if (assignmentError) throw assignmentError;
      
      if (!studentAssignments || studentAssignments.length === 0) {
        setFormations([]);
        return;
      }
      
      const studentIds = studentAssignments.map(sa => sa.student_id);
      
      // 2. Récupérer les formations de ces étudiants via user_formation_assignments
      const { data: formationAssignments, error: formationError } = await supabase
        .from('user_formation_assignments')
        .select(`
          user_id,
          formation_id,
          formations(
            id,
            title,
            level,
            description,
            start_date,
            end_date,
            color,
            duration,
            formation_modules(id)
          )
        `)
        .in('user_id', studentIds);
      
      if (formationError) throw formationError;

      // 3. Combiner les données
      const enrichedData: TutorFormation[] = [];
      
      formationAssignments?.forEach(fa => {
        const studentAssignment = studentAssignments.find(sa => sa.student_id === fa.user_id);
        const student = studentAssignment?.users as any;
        const formation = fa.formations as any;
        
        if (student && formation) {
          enrichedData.push({
            formation_id: formation.id,
            formation_title: formation.title,
            formation_level: formation.level,
            formation_description: formation.description,
            formation_start_date: formation.start_date,
            formation_end_date: formation.end_date,
            formation_color: formation.color,
            formation_duration: formation.duration,
            modules_count: formation.formation_modules?.length || 0,
            student_id: fa.user_id,
            student_first_name: student.first_name,
            student_last_name: student.last_name,
            student_email: student.email
          });
        }
      });

      setFormations(enrichedData);
    } catch (err) {
      console.error('Erreur lors du chargement des formations tuteur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorFormations();
  }, [userId, userRole]);

  // Récupérer les formations uniques
  const getUniqueFormations = () => {
    const uniqueFormations = new Map();
    formations.forEach(formation => {
      if (!uniqueFormations.has(formation.formation_id)) {
        uniqueFormations.set(formation.formation_id, {
          ...formation,
          students: []
        });
      }
      uniqueFormations.get(formation.formation_id).students.push({
        id: formation.student_id,
        first_name: formation.student_first_name,
        last_name: formation.student_last_name,
        email: formation.student_email
      });
    });
    return Array.from(uniqueFormations.values());
  };

  return {
    formations,
    loading,
    error,
    getUniqueFormations,
    refetch: fetchTutorFormations
  };
};