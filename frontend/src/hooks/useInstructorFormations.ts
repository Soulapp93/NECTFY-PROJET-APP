import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface InstructorFormation {
  formation_id: string;
  title: string;
  level: string;
  color?: string;
  module_title: string;
}

export const useInstructorFormations = () => {
  const [allInstructorFormations, setAllInstructorFormations] = useState<Record<string, InstructorFormation[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { establishmentId } = useCurrentUser();

  const fetchAllInstructorFormations = async () => {
    if (!establishmentId) {
      setAllInstructorFormations({});
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('module_instructors')
        .select(`
          instructor_id,
          module:formation_modules(
            id,
            title,
            formation:formations(id, title, level, color, establishment_id)
          )
        `);
      
      if (error) throw error;
      
      // Grouper par instructor_id et dédupliquer par formation
      const formationsByInstructor: Record<string, InstructorFormation[]> = {};
      
      data?.forEach((item: any) => {
        if (!item.module?.formation || item.module.formation.establishment_id !== establishmentId) return;
        
        const instructorId = item.instructor_id;
        if (!formationsByInstructor[instructorId]) {
          formationsByInstructor[instructorId] = [];
        }
        
        // Vérifier si cette formation existe déjà pour cet instructeur
        const existingFormation = formationsByInstructor[instructorId].find(
          f => f.formation_id === item.module.formation.id
        );
        
        if (!existingFormation) {
          formationsByInstructor[instructorId].push({
            formation_id: item.module.formation.id,
            title: item.module.formation.title,
            level: item.module.formation.level,
            color: item.module.formation.color,
            module_title: item.module.title
          });
        }
      });
      
      setAllInstructorFormations(formationsByInstructor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations formateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInstructorFormations();
  }, [establishmentId]);

  const getInstructorFormations = (instructorId: string): InstructorFormation[] => {
    return allInstructorFormations[instructorId] || [];
  };

  return {
    allInstructorFormations,
    loading,
    error,
    getInstructorFormations,
    refetch: fetchAllInstructorFormations
  };
};
