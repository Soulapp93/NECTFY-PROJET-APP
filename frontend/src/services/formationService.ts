
import { supabase } from '@/integrations/supabase/client';

export interface Formation {
  id: string;
  title: string;
  description?: string;
  level: string;
  start_date: string;
  end_date: string;
  status: string;
  color?: string;
  duration: number;
  max_students: number;
  price?: number;
  establishment_id: string;
  created_at: string;
  updated_at: string;
  formation_modules?: any[];
}

export const formationService = {
  async createFormation(formationData: Omit<Formation, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Création de formation avec les données:', formationData);
    
    const { data, error } = await supabase
      .from('formations')
      .insert([formationData])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la formation:', error);
      throw new Error(`Erreur lors de la création de la formation: ${error.message}`);
    }

    console.log('Formation créée avec succès:', data);
    return data;
  },

  async getFormations() {
    console.log('Récupération des formations...');
    
    const { data, error } = await supabase
      .from('formations')
      .select(`
        *,
        formation_modules (
          id,
          title,
          description,
          duration_hours,
          order_index
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      throw new Error(`Erreur lors de la récupération des formations: ${error.message}`);
    }

    console.log('Formations récupérées:', data);
    return data;
  },

  async getAllFormations() {
    return this.getFormations();
  },

  async getFormationById(id: string) {
    console.log('Récupération de la formation par ID:', id);
    
    const { data, error } = await supabase
      .from('formations')
      .select(`
        *,
        formation_modules (
          id,
          title,
          description,
          duration_hours,
          order_index
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la formation:', error);
      throw new Error(`Erreur lors de la récupération de la formation: ${error.message}`);
    }

    console.log('Formation récupérée:', data);
    return data;
  },

  async updateFormation(id: string, formationData: Partial<Formation>) {
    console.log('Mise à jour de la formation:', id, formationData);
    
    const { data, error } = await supabase
      .from('formations')
      .update(formationData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la formation:', error);
      throw new Error(`Erreur lors de la mise à jour de la formation: ${error.message}`);
    }

    console.log('Formation mise à jour avec succès:', data);
    return data;
  },

  async deleteFormation(id: string) {
    console.log('Suppression de la formation:', id);
    
    try {
      // D'abord supprimer les modules associés
      const { error: modulesError } = await supabase
        .from('formation_modules')
        .delete()
        .eq('formation_id', id);

      if (modulesError) {
        console.error('Erreur lors de la suppression des modules:', modulesError);
        throw new Error(`Erreur lors de la suppression des modules: ${modulesError.message}`);
      }

      // Ensuite supprimer la formation
      const { error: formationError } = await supabase
        .from('formations')
        .delete()
        .eq('id', id);

      if (formationError) {
        console.error('Erreur lors de la suppression de la formation:', formationError);
        throw new Error(`Erreur lors de la suppression de la formation: ${formationError.message}`);
      }

      console.log('Formation supprimée avec succès');
      return true;

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  async getFormationParticipantsCount(formationId: string): Promise<number> {
    console.log('Récupération du nombre de participants pour la formation:', formationId);
    
    const { count, error } = await supabase
      .from('user_formation_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('formation_id', formationId);

    if (error) {
      console.error('Erreur lors de la récupération des participants:', error);
      return 0;
    }

    return count || 0;
  }
};
