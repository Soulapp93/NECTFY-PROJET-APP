
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type ModuleDocument = Database['public']['Tables']['module_documents']['Row'];

export const moduleDocumentService = {
  async getModuleDocuments(moduleId: string) {
    const { data, error } = await supabase
      .from('module_documents')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async createDocument(document: Database['public']['Tables']['module_documents']['Insert']) {
    const { data, error } = await supabase
      .from('module_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDocument(id: string, updates: Database['public']['Tables']['module_documents']['Update']) {
    const { data, error } = await supabase
      .from('module_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDocument(id: string) {
    const { error } = await supabase
      .from('module_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
