import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { virtualClassService, VirtualClass } from '@/services/virtualClassService';
import { useCurrentUser } from './useCurrentUser';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useVirtualClasses = () => {
  return useQuery({
    queryKey: ['virtual-classes'],
    queryFn: virtualClassService.getVirtualClasses,
  });
};

export const useVirtualClass = (id: string) => {
  return useQuery({
    queryKey: ['virtual-class', id],
    queryFn: () => virtualClassService.getVirtualClassById(id),
    enabled: !!id,
  });
};

export const useCreateVirtualClass = () => {
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useCurrentUser();

  return useMutation({
    mutationFn: async (classData: any) => {
      // Tente d'utiliser l'utilisateur authentifié; sinon, fallback dev
      const { data: { user } } = await supabase.auth.getUser();

      let establishmentId: string | null = null;
      let createdBy: string | null = currentUserId ?? null;

      if (user?.id) {
        const { data: profile } = await supabase
          .from('users')
          .select('establishment_id')
          .eq('id', user.id)
          .maybeSingle();
        establishmentId = profile?.establishment_id ?? null;
        createdBy = createdBy ?? user.id;
      }

      // Fallback dev: ID d'établissement démo si non authentifié
      if (!establishmentId) {
        establishmentId = '550e8400-e29b-41d4-a716-446655440000';
      }

      return virtualClassService.createVirtualClass({
        ...classData,
        establishment_id: establishmentId,
        created_by: createdBy,
        current_participants: 0,
        status: 'Programmé',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Classe virtuelle créée avec succès');
    },
    onError: (error) => {
      console.error('Error creating virtual class:', error);
      toast.error('Erreur lors de la création de la classe virtuelle');
    },
  });
};

export const useUpdateVirtualClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<VirtualClass> }) => {
      return virtualClassService.updateVirtualClass(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Classe virtuelle mise à jour');
    },
    onError: (error) => {
      console.error('Error updating virtual class:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });
};

export const useUpdateClassStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      return virtualClassService.updateVirtualClass(id, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      const statusMessages = {
        'Annulé': 'Classe virtuelle annulée',
        'En cours': 'Classe virtuelle démarrée',
        'Terminé': 'Classe virtuelle terminée',
        'Programmé': 'Classe virtuelle reprogrammée'
      };
      toast.success(statusMessages[status as keyof typeof statusMessages] || 'Statut mis à jour');
    },
    onError: (error) => {
      console.error('Error updating class status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });
};

export const useDeleteVirtualClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: virtualClassService.deleteVirtualClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Classe virtuelle supprimée');
    },
    onError: (error) => {
      console.error('Error deleting virtual class:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  const { userId: currentUserId } = useCurrentUser();

  return useMutation({
    mutationFn: (classId: string) => {
      if (!currentUserId) throw new Error('User not authenticated');
      return virtualClassService.joinClass(classId, currentUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-classes'] });
      toast.success('Vous avez rejoint la classe virtuelle');
    },
    onError: (error) => {
      console.error('Error joining class:', error);
      toast.error('Erreur lors de l\'inscription à la classe');
    },
  });
};

export const useInstructors = () => {
  return useQuery({
    queryKey: ['instructors'],
    queryFn: virtualClassService.getInstructors,
  });
};

export const useFormationsForSelect = () => {
  return useQuery({
    queryKey: ['formations-select'],
    queryFn: virtualClassService.getFormations,
  });
};