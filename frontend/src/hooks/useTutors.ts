import { useState, useEffect } from 'react';
import { tutorService, Tutor, CreateTutorData, TutorWithStudents } from '@/services/tutorService';
import { toast } from 'sonner';

export const useTutors = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [tutorsWithStudents, setTutorsWithStudents] = useState<TutorWithStudents[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTutors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tutorService.getAllTutors();
      setTutors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tuteurs');
      toast.error('Erreur lors du chargement des tuteurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorsWithStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tutorService.getTutorsWithStudents();
      setTutorsWithStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const createTutor = async (tutorData: CreateTutorData) => {
    try {
      setLoading(true);
      const newTutor = await tutorService.createTutor(tutorData);
      setTutors(prev => [newTutor, ...prev]);
      toast.success('Tuteur créé avec succès');
      return newTutor;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du tuteur';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTutor = async (id: string, tutorData: Partial<CreateTutorData>) => {
    try {
      setLoading(true);
      const updatedTutor = await tutorService.updateTutor(id, tutorData);
      setTutors(prev => prev.map(tutor => tutor.id === id ? updatedTutor : tutor));
      toast.success('Tuteur mis à jour avec succès');
      return updatedTutor;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du tuteur';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTutor = async (id: string) => {
    try {
      setLoading(true);
      await tutorService.deleteTutor(id);
      setTutors(prev => prev.filter(tutor => tutor.id !== id));
      toast.success('Tuteur supprimé avec succès');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du tuteur';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignStudentToTutor = async (assignment: {
    tutor_id: string;
    student_id: string;
    contract_type?: string;
    contract_start_date?: string;
    contract_end_date?: string;
  }) => {
    try {
      setLoading(true);
      await tutorService.assignStudentToTutor(assignment);
      toast.success('Étudiant assigné au tuteur avec succès');
      await fetchTutorsWithStudents(); // Rafraîchir les données
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'assignation';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
    fetchTutorsWithStudents();
  }, []);

  return {
    tutors,
    tutorsWithStudents,
    loading,
    error,
    fetchTutors,
    fetchTutorsWithStudents,
    createTutor,
    updateTutor,
    deleteTutor,
    assignStudentToTutor,
    refetch: fetchTutors
  };
};