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

interface RpcFormation {
  id: string;
  title: string;
  description: string | null;
  level: string;
  status: string;
  start_date: string;
  end_date: string;
  duration: number;
  color: string | null;
  max_students: number;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    duration_hours: number;
    order_index: number;
  }>;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TutorFormationsResponse {
  error: string | null;
  apprentice_id: string | null;
  formations: RpcFormation[];
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
      const { data, error: rpcError } = await supabase.rpc('get_tutor_apprentice_formations');

      if (rpcError) {
        console.error('Erreur get_tutor_apprentice_formations:', rpcError);
        setError(rpcError.message);
        setFormations([]);
        setLoading(false);
        return;
      }

      // Cast vers le type attendu
      const response = data as unknown as TutorFormationsResponse;

      if (response.error) {
        console.error('Erreur RPC:', response.error);
        setError(response.error);
        setFormations([]);
      } else {
        // Transformer les données RPC vers le format TutorFormation
        const transformedFormations: TutorFormation[] = (response.formations || []).map(f => ({
          formation_id: f.id,
          formation_title: f.title,
          formation_level: f.level,
          formation_description: f.description || undefined,
          formation_start_date: f.start_date,
          formation_end_date: f.end_date,
          formation_color: f.color || undefined,
          formation_duration: f.duration,
          modules_count: f.modules?.length || 0,
          student_id: f.student.id,
          student_first_name: f.student.first_name,
          student_last_name: f.student.last_name,
          student_email: f.student.email
        }));
        
        setFormations(transformedFormations);
        setApprenticeId(response.apprentice_id);
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
