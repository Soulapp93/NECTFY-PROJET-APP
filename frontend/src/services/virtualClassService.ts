import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type VirtualClass = Database['public']['Tables']['virtual_classes']['Row'] & {
  instructor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  formation?: {
    id: string;
    title: string;
    color: string;
  };
  participants_count?: number;
};

export type VirtualClassParticipant = Database['public']['Tables']['virtual_class_participants']['Row'];
export type VirtualClassMaterial = Database['public']['Tables']['virtual_class_materials']['Row'];

export const virtualClassService = {
  async getVirtualClasses() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // Récupérer l'utilisateur si authentifié (sinon, on ne filtre pas et on retourne tout)
    let user: { role?: string | null; establishment_id?: string | null } | null = null;
    if (userId) {
      const { data } = await supabase
        .from('users')
        .select('role, establishment_id')
        .eq('id', userId)
        .maybeSingle();
      user = data ?? null;
    }

    let query = supabase
      .from('virtual_classes')
      .select(`
        *,
        instructor:users!instructor_id(id, first_name, last_name, email),
        formation:formations!formation_id(id, title, color),
        participants:virtual_class_participants(count)
      `);

    // Tous les utilisateurs peuvent voir toutes les classes virtuelles
    // Pas de filtrage par rôle ou formation - accès universel
    
    query = query
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data as VirtualClass[];
  },

  async getVirtualClassById(id: string) {
    const { data, error } = await supabase
      .from('virtual_classes')
      .select(`
        *,
        instructor:users!instructor_id(id, first_name, last_name, email),
        formation:formations!formation_id(id, title, color),
        participants:virtual_class_participants(
          id,
          user_id,
          status,
          joined_at,
          left_at,
          user:users(first_name, last_name, email)
        ),
        materials:virtual_class_materials(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createVirtualClass(classData: Database['public']['Tables']['virtual_classes']['Insert']) {
    const { data, error } = await supabase
      .from('virtual_classes')
      .insert(classData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVirtualClass(id: string, updates: Database['public']['Tables']['virtual_classes']['Update']) {
    const { data, error } = await supabase
      .from('virtual_classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteVirtualClass(id: string) {
    const { error } = await supabase
      .from('virtual_classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async joinClass(classId: string, userId: string) {
    const { data, error } = await supabase
      .from('virtual_class_participants')
      .insert({
        virtual_class_id: classId,
        user_id: userId,
        status: 'Inscrit'
      })
      .select()
      .single();

    if (error) throw error;

    // Update participant count
    await this.updateParticipantCount(classId);
    return data;
  },

  async leaveClass(classId: string, userId: string) {
    const { error } = await supabase
      .from('virtual_class_participants')
      .delete()
      .eq('virtual_class_id', classId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update participant count
    await this.updateParticipantCount(classId);
  },

  async updateParticipantStatus(classId: string, userId: string, status: 'Présent' | 'Absent') {
    const { data, error } = await supabase
      .from('virtual_class_participants')
      .update({ 
        status,
        joined_at: status === 'Présent' ? new Date().toISOString() : null,
        left_at: status === 'Absent' ? new Date().toISOString() : null
      })
      .eq('virtual_class_id', classId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateParticipantCount(classId: string) {
    const { count } = await supabase
      .from('virtual_class_participants')
      .select('*', { count: 'exact', head: true })
      .eq('virtual_class_id', classId)
      .eq('status', 'Inscrit');

    await supabase
      .from('virtual_classes')
      .update({ current_participants: count || 0 })
      .eq('id', classId);
  },

  async addMaterial(material: Database['public']['Tables']['virtual_class_materials']['Insert']) {
    const { data, error } = await supabase
      .from('virtual_class_materials')
      .insert(material)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInstructors() {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('role', 'Formateur')
      .order('first_name');

    if (error) throw error;
    return data;
  },

  async getFormations() {
    const { data, error } = await supabase
      .from('formations')
      .select('id, title, color')
      .eq('status', 'Actif')
      .order('title');

    if (error) throw error;
    return data;
  }
};