
import { supabase } from '@/integrations/supabase/client';

export interface Establishment {
  id: string;
  name: string;
  email?: string;
  type?: string;
  address?: string;
  phone?: string;
  website?: string;
  director?: string;
  siret?: string;
  logo_url?: string;
  number_of_students?: string;
  number_of_instructors?: string;
}

export const establishmentService = {
  // Get the current user's establishment
  async getCurrentUserEstablishment(): Promise<Establishment | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return null;
    }

    // Get the user's establishment_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('establishment_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.establishment_id) {
      return null;
    }

    // Get the establishment details
    const { data: establishment, error } = await supabase
      .from('establishments')
      .select('*')
      .eq('id', userData.establishment_id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de l\'établissement:', error);
      return null;
    }

    return establishment;
  },

  async updateEstablishment(id: string, data: Partial<Establishment>): Promise<Establishment> {
    const { data: updated, error } = await supabase
      .from('establishments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de l\'établissement:', error);
      throw error;
    }

    return updated;
  },

  // Legacy methods - kept for backwards compatibility but should use getCurrentUserEstablishment
  async getFirstEstablishment() {
    return this.getCurrentUserEstablishment();
  },

  async getOrCreateDefaultEstablishment() {
    return this.getCurrentUserEstablishment();
  }
};
