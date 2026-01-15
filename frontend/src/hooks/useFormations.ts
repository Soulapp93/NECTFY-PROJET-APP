
import { useState, useEffect } from 'react';
import { formationService, Formation } from '@/services/formationService';

export const useFormations = () => {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await formationService.getFormations();
      setFormations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  return {
    formations,
    loading,
    error,
    refetch: fetchFormations
  };
};
