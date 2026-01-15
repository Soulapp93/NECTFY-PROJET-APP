
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
  const [userFormations, setUserFormations] = useState<UserFormationAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useCurrentUser();

  const fetchUserFormations = async () => {
    if (!userId) {
      setUserFormations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_formation_assignments')
        .select(`
          id,
          user_id,
          formation_id,
          assigned_at,
          formation:formations(id, title, level, color)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      setUserFormations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserFormations();
  }, [userId]);

  const getUserFormations = (userId: string) => {
    return userFormations.filter(assignment => assignment.user_id === userId);
  };

  return {
    userFormations,
    loading,
    error,
    getUserFormations,
    refetch: fetchUserFormations
  };
};
