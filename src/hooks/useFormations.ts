
import { useState, useEffect, useCallback } from 'react';
import { formationService, Formation } from '@/services/formationService';

export const useFormations = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFormations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await formationService.getFormations();
      setFormations(data || []);
    } catch (err) {
      console.error('Erreur useFormations:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFormations();
  }, [fetchFormations]);

  return {
    formations,
    loading,
    error,
    refetch: fetchFormations
  };
};
