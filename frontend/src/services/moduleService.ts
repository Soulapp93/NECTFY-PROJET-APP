
import { supabase } from '@/integrations/supabase/client';

export interface FormationModule {
  id: string;
  formation_id: string;
  title: string;
  description?: string;
  duration_hours: number;
  order_index: number;
  instructors?: Instructor[];
}

export interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ModuleInstructor {
  id: string;
  module_id: string;
  instructor_id: string;
  instructor: Instructor;
}

export const moduleService = {
  async getFormationModules(formationId: string) {
    const { data, error } = await supabase
      .from('formation_modules')
      .select(`
        *,
        module_instructors (
          id,
          instructor_id,
          instructor:users (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('formation_id', formationId)
      .order('order_index');
    
    if (error) throw error;
    return data;
  },

  async createModule(moduleData: Omit<FormationModule, 'id'>, instructorIds: string[]) {
    const { data: module, error: moduleError } = await supabase
      .from('formation_modules')
      .insert(moduleData)
      .select()
      .single();

    if (moduleError) throw moduleError;

    // Assigner les formateurs au module
    if (instructorIds.length > 0) {
      const assignments = instructorIds.map(instructorId => ({
        module_id: module.id,
        instructor_id: instructorId
      }));

      const { error: assignmentError } = await supabase
        .from('module_instructors')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    return module;
  },

  async updateModule(moduleId: string, moduleData: { title: string; description?: string; order_index: number; duration_hours?: number }, instructorIds: string[]) {
    // Mettre à jour le module
    const { error: moduleError } = await supabase
      .from('formation_modules')
      .update({
        title: moduleData.title,
        description: moduleData.description,
        order_index: moduleData.order_index,
        duration_hours: moduleData.duration_hours
      })
      .eq('id', moduleId);

    if (moduleError) throw moduleError;

    // Supprimer les anciennes assignations de formateurs
    const { error: deleteError } = await supabase
      .from('module_instructors')
      .delete()
      .eq('module_id', moduleId);

    if (deleteError) throw deleteError;

    // Ajouter les nouvelles assignations de formateurs
    if (instructorIds.length > 0) {
      const assignments = instructorIds.map(instructorId => ({
        module_id: moduleId,
        instructor_id: instructorId
      }));

      const { error: assignmentError } = await supabase
        .from('module_instructors')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }
  },

  async deleteModule(moduleId: string) {
    // Supprimer d'abord les assignations de formateurs
    await supabase
      .from('module_instructors')
      .delete()
      .eq('module_id', moduleId);

    // Supprimer le module
    const { error } = await supabase
      .from('formation_modules')
      .delete()
      .eq('id', moduleId);

    if (error) throw error;
  },

  async getInstructors() {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('role', 'Formateur')
      .order('first_name');
    
    if (error) throw error;
    return data;
  }
};
