import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export interface UserFormationAssignment {
  id: string;
  user_id: string;
  formation_id: string;
  assigned_at: string;
  formation: {
    id: string;
    title: string;
    level: string;
    color?: string;
  };
}

export const useUserFormations = () => {
  const [allFormations, setAllFormations] = useState<UserFormationAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, establishmentId } = useCurrentUser();

  const fetchAllFormations = async () => {
    if (!establishmentId) {
      setAllFormations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Récupérer toutes les assignations de l'établissement
      const { data, error } = await supabase
        .from('user_formation_assignments')
        .select(`
          id,
          user_id,
          formation_id,
          assigned_at,
          formation:formations(id, title, level, color, establishment_id)
        `);
      
      if (error) throw error;
      
      // Filtrer par establishment_id de la formation
      const filteredData = (data || []).filter(
        (item: any) => item.formation?.establishment_id === establishmentId
      );
      
      setAllFormations(filteredData as UserFormationAssignment[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFormations();
  }, [establishmentId]);

  // Récupérer les formations d'un utilisateur spécifique
  const getUserFormations = (targetUserId: string): UserFormationAssignment[] => {
    return allFormations.filter(assignment => assignment.user_id === targetUserId);
  };

  // Récupérer les formations de l'utilisateur courant
  const userFormations = userId ? getUserFormations(userId) : [];

  return {
    userFormations,
    allFormations,
    loading,
    error,
    getUserFormations,
    refetch: fetchAllFormations
  };
};
