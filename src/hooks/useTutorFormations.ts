import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface RpcFormationResult {
  formation_id: string;
  formation_title: string;
  formation_level: string;
  formation_status: string;
  student_id: string;
  student_name: string;
}

/**
 * Hook pour récupérer les formations de l'apprenti assigné au tuteur.
 * Utilise une RPC SECURITY DEFINER pour contourner les problèmes RLS.
 */
export const useTutorFormations = () => {
  const [formations, setFormations] = useState<TutorFormation[]>([]);
  const [apprenticeId, setApprenticeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorFormations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier si l'utilisateur est connecté
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setFormations([]);
        setApprenticeId(null);
        setLoading(false);
        return;
      }

      // Appeler la RPC SECURITY DEFINER
      const { data, error: rpcError } = await supabase.rpc('get_tutor_apprentice_formations') as {
        data: RpcFormationResult[] | null;
        error: any;
      };

      if (rpcError) {
        console.error('Erreur get_tutor_apprentice_formations:', rpcError);
        setError(rpcError.message);
        setFormations([]);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setFormations([]);
        setApprenticeId(null);
        setLoading(false);
        return;
      }

      // Transformer les données RPC vers le format TutorFormation
      const transformedFormations: TutorFormation[] = data.map(f => {
        const nameParts = (f.student_name || '').split(' ');
        return {
          formation_id: f.formation_id,
          formation_title: f.formation_title,
          formation_level: f.formation_level,
          formation_start_date: '',
          formation_end_date: '',
          student_id: f.student_id,
          student_first_name: nameParts[0] || '',
          student_last_name: nameParts.slice(1).join(' ') || '',
          student_email: ''
        };
      });
      
      setFormations(transformedFormations);
      if (data.length > 0) {
        setApprenticeId(data[0].student_id);
      }
    } catch (err) {
      console.error('Erreur useTutorFormations:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setFormations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutorFormations();
  }, [fetchTutorFormations]);

  // Récupérer les formations uniques
  const getUniqueFormations = useCallback(() => {
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
  }, [formations]);

  return {
    formations,
    apprenticeId,
    loading,
    error,
    getUniqueFormations,
    refetch: fetchTutorFormations
  };
};
