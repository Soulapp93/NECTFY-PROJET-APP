
import { useState, useEffect } from 'react';
import { moduleService, Instructor } from '@/services/moduleService';

export const useInstructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await moduleService.getInstructors();
      setInstructors(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des formateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  return {
    instructors,
    loading,
    error,
    refetch: fetchInstructors
  };
};
