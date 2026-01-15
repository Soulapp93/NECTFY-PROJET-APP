import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Assignment = Database['public']['Tables']['module_assignments']['Row'];
export type AssignmentSubmission = Database['public']['Tables']['assignment_submissions']['Row'] & {
  student?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  correction?: Database['public']['Tables']['assignment_corrections']['Row'];
};

export const assignmentService = {
  async getModuleAssignments(moduleId: string) {
    const { data, error } = await supabase
      .from('module_assignments')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  async createAssignment(assignment: Database['public']['Tables']['module_assignments']['Insert']) {
    const { data, error } = await supabase
      .from('module_assignments')
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;

    // Notifier si le devoir est publié directement
    if (assignment.is_published) {
      await this.notifyAssignmentPublication(data);
    }

    return data;
  },

  async updateAssignment(id: string, updates: Database['public']['Tables']['module_assignments']['Update']) {
    const { data, error } = await supabase
      .from('module_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notifier si le devoir vient d'être publié
    if (updates.is_published === true) {
      await this.notifyAssignmentPublication(data);
    }

    return data;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase
      .from('module_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addAssignmentFile(file: Database['public']['Tables']['assignment_files']['Insert']) {
    const { data, error } = await supabase
      .from('assignment_files')
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAssignmentSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        student:users(first_name, last_name, email),
        correction:assignment_corrections(*)
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async submitAssignment(submission: Database['public']['Tables']['assignment_submissions']['Insert']) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addSubmissionFile(file: Database['public']['Tables']['submission_files']['Insert']) {
    const { data, error } = await supabase
      .from('submission_files')
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissionFiles(submissionId: string) {
    const { data, error } = await supabase
      .from('submission_files')
      .select('*')
      .eq('submission_id', submissionId);
    
    if (error) throw error;
    return data;
  },

  async correctSubmission(
    submissionId: string,
    correction: Omit<Database['public']['Tables']['assignment_corrections']['Insert'], 'submission_id'>
  ) {
    const { data, error } = await supabase
      .from('assignment_corrections')
      .upsert(
        {
          ...correction,
          submission_id: submissionId,
          is_corrected: true,
          corrected_at: new Date().toISOString(),
        },
        {
          // IMPORTANT: la contrainte unique est sur submission_id (pas sur id)
          onConflict: 'submission_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async publishCorrections(assignmentId: string) {
    // Get all submissions for the assignment
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (!submissions) return;

    // Update all corrections to published
    const { error } = await supabase
      .from('assignment_corrections')
      .update({ published_at: new Date().toISOString() })
      .in('submission_id', submissions.map(s => s.id))
      .eq('is_corrected', true);

    if (error) throw error;

    // Notifier la publication des corrections
    await this.notifyCorrectionsPublished(assignmentId);
  },

  // Notifier la publication d'un devoir
  async notifyAssignmentPublication(assignment: Assignment) {
    try {
      const { notificationService } = await import('./notificationService');
      
      // Récupérer la formation via le module
      const { data: module } = await supabase
        .from('formation_modules')
        .select('formation_id')
        .eq('id', assignment.module_id)
        .single();

      if (module?.formation_id) {
        await notificationService.notifyFormationUsers(
          module.formation_id,
          'Nouveau devoir publié',
          `Un nouveau devoir "${assignment.title}" a été publié.`,
          'assignment',
          { 
            assignment_id: assignment.id,
            module_id: assignment.module_id,
            due_date: assignment.due_date
          }
        );
      }
    } catch (error) {
      console.error('Error sending assignment publication notifications:', error);
    }
  },

  // Notifier la publication des corrections
  async notifyCorrectionsPublished(assignmentId: string) {
    try {
      const { notificationService } = await import('./notificationService');
      
      // Récupérer l'assignment et les étudiants qui ont rendu
      const { data: assignment } = await supabase
        .from('module_assignments')
        .select(`
          *,
          assignment_submissions(student_id)
        `)
        .eq('id', assignmentId)
        .single();

      if (assignment?.assignment_submissions) {
        // Notifier chaque étudiant qui a rendu le devoir
        const studentIds = assignment.assignment_submissions.map(s => s.student_id);
        
        for (const studentId of studentIds) {
          await notificationService.notifyUser(
            studentId,
            'Correction publiée',
            `La correction du devoir "${assignment.title}" est disponible.`,
            'correction',
            { 
              assignment_id: assignmentId,
              module_id: assignment.module_id
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending correction notifications:', error);
    }
  }
};
