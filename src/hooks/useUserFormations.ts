
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';
import { retryQuery } from '@/lib/supabaseRetry';

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

const RETRY_OPTIONS = {
  maxRetries: 3,
  baseDelayMs: 500,
  onRetry: (attempt: number, err: Error) => {
    console.warn(`Retry attempt ${attempt} for useUserFormations:`, err.message);
  }
};

export const useUserFormations = () => {
  const [userFormations, setUserFormations] = useState<UserFormationAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, loading: userLoading } = useCurrentUser();

  const fetchUserFormations = useCallback(async () => {
    if (!userId) {
      setUserFormations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: queryError } = await retryQuery(
        () => supabase
          .from('user_formation_assignments')
          .select(`
            id,
            user_id,
            formation_id,
            assigned_at,
            formation:formations(id, title, level, color)
          `)
          .eq('user_id', userId),
        RETRY_OPTIONS
      );
      
      if (queryError) {
        console.error('Erreur useUserFormations:', queryError);
        setError(queryError.message);
        setUserFormations([]);
        return;
      }
      
      setUserFormations(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur inattendue useUserFormations:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userLoading) {
      fetchUserFormations();
    }
  }, [userId, userLoading, fetchUserFormations]);

  const getUserFormations = (targetUserId: string) => {
    return userFormations.filter(assignment => assignment.user_id === targetUserId);
  };

  return {
    userFormations,
    loading: loading || userLoading,
    error,
    getUserFormations,
    refetch: fetchUserFormations
  };
};
