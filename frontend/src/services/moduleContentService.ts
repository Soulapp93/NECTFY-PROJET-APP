
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type ModuleContent = Database['public']['Tables']['module_contents']['Row'];

export const moduleContentService = {
  async getModuleContents(moduleId: string) {
    const { data, error } = await supabase
      .from('module_contents')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async createContent(content: Database['public']['Tables']['module_contents']['Insert']) {
    const { data, error } = await supabase
      .from('module_contents')
      .insert(content)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateContent(id: string, updates: Database['public']['Tables']['module_contents']['Update']) {
    const { data, error } = await supabase
      .from('module_contents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteContent(id: string) {
    const { error } = await supabase
      .from('module_contents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
