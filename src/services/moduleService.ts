import { supabase } from '@/integrations/supabase/client';

// Type helper for database operations on non-typed tables
const db = supabase as any;

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
    // Fetch modules first
    const { data: modules, error: modulesError } = await supabase
      .from('formation_modules')
      .select('*')
      .eq('formation_id', formationId)
      .order('order_index');
    
    if (modulesError) throw modulesError;
    
    // Fetch instructors for each module
    const modulesWithInstructors = await Promise.all(
      (modules || []).map(async (mod) => {
        const { data: instructorAssignments, error: assignError } = await db
          .from('module_instructors')
          .select('instructor_id')
          .eq('module_id', mod.id);
        
        if (assignError) {
          console.warn('Erreur récupération formateurs module:', assignError);
          return { ...mod, instructors: [], module_instructors: [] };
        }
        
        if (instructorAssignments && instructorAssignments.length > 0) {
          const instructorIds = instructorAssignments.map((a: any) => a.instructor_id);
          const { data: instructors } = await supabase
            .from('users')
            .select('id, first_name, last_name, email')
            .in('id', instructorIds);
          
          return { 
            ...mod, 
            instructors: instructors || [],
            module_instructors: instructorAssignments.map((a: any) => ({ instructor_id: a.instructor_id }))
          };
        }
        return { ...mod, instructors: [], module_instructors: [] };
      })
    );
    
    return modulesWithInstructors;
  },

  async createModule(moduleData: Omit<FormationModule, 'id'>, instructorIds: string[]) {
    const { data: module, error: moduleError } = await supabase
      .from('formation_modules')
      .insert({
        formation_id: moduleData.formation_id,
        title: moduleData.title,
        description: moduleData.description,
        duration_hours: moduleData.duration_hours,
        order_index: moduleData.order_index
      })
      .select()
      .single();

    if (moduleError) throw moduleError;

    // Assigner les formateurs au module
    if (instructorIds.length > 0) {
      const assignments = instructorIds.map(instructorId => ({
        module_id: module.id,
        instructor_id: instructorId
      }));

      const { error: assignmentError } = await db
        .from('module_instructors')
        .insert(assignments);

      if (assignmentError) {
        console.error('Erreur assignation formateurs:', assignmentError);
        throw assignmentError;
      }
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
    const { error: deleteError } = await db
      .from('module_instructors')
      .delete()
      .eq('module_id', moduleId);

    if (deleteError) {
      console.error('Erreur suppression anciennes assignations:', deleteError);
      throw deleteError;
    }

    // Ajouter les nouvelles assignations de formateurs
    if (instructorIds.length > 0) {
      const assignments = instructorIds.map(instructorId => ({
        module_id: moduleId,
        instructor_id: instructorId
      }));

      const { error: insertError } = await db
        .from('module_instructors')
        .insert(assignments);

      if (insertError) {
        console.error('Erreur insertion nouvelles assignations:', insertError);
        throw insertError;
      }
    }
  },

  async deleteModule(moduleId: string) {
    // Supprimer d'abord les assignations de formateurs
    const { error: deleteAssignError } = await db
      .from('module_instructors')
      .delete()
      .eq('module_id', moduleId);

    if (deleteAssignError) {
      console.warn('Erreur suppression assignations:', deleteAssignError);
    }

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
