import { supabase } from '@/integrations/supabase/client';

// Type helper for database operations on non-typed tables
const db = supabase as any;

export interface ModuleDocument {
  id: string;
  module_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  title: string;
  description?: string;
  document_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateModuleDocumentData {
  module_id: string;
  file_name?: string | null;
  file_url?: string | null;
  file_size?: number | null;
  file_type?: string;
  title: string;
  description?: string;
  document_type: string;
}

export const moduleDocumentService = {
  async getModuleDocuments(moduleId: string): Promise<ModuleDocument[]> {
    const { data, error } = await db
      .from('module_documents')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return (data || []) as ModuleDocument[];
  },

  async createDocument(document: CreateModuleDocumentData): Promise<ModuleDocument> {
    const { data, error } = await db
      .from('module_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data as ModuleDocument;
  },

  async updateDocument(id: string, updates: Partial<CreateModuleDocumentData>): Promise<ModuleDocument> {
    const { data, error } = await db
      .from('module_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ModuleDocument;
  },

  async deleteDocument(id: string): Promise<void> {
    const { error } = await db
      .from('module_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
