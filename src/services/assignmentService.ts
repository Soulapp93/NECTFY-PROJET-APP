import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Assignment = Database['public']['Tables']['module_assignments']['Row'];

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  student?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  correction?: {
    id: string;
    submission_id: string;
    corrector_id: string;
    grade: number | null;
    feedback: string | null;
    published_at: string | null;
    is_corrected?: boolean;
    score?: number | null;
    max_score?: number | null;
    comments?: string | null;
    created_at: string;
    updated_at: string;
  };
  submission_text?: string | null;
}

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

  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    // Fetch submissions
    const { data: submissions, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    if (!submissions) return [];

    // Fetch student info and corrections separately
    const enrichedSubmissions: AssignmentSubmission[] = [];
    
    for (const submission of submissions) {
      // Fetch student info
      const { data: student } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', submission.student_id)
        .single();

      // Fetch correction
      const { data: correction } = await supabase
        .from('assignment_corrections')
        .select('*')
        .eq('submission_id', submission.id)
        .maybeSingle();

      enrichedSubmissions.push({
        ...submission,
        submission_text: submission.content,
        student: student || undefined,
        correction: correction ? {
          ...correction,
          is_corrected: !!correction.grade,
          score: correction.grade,
          max_score: 20, // Default max score
          comments: correction.feedback
        } : undefined
      });
    }

    return enrichedSubmissions;
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
    // Check if correction exists
    const { data: existing } = await supabase
      .from('assignment_corrections')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle();

    if (existing) {
      // Update existing correction
      const { data, error } = await supabase
        .from('assignment_corrections')
        .update({
          ...correction,
          updated_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new correction
      const { data, error } = await supabase
        .from('assignment_corrections')
        .insert({
          ...correction,
          submission_id: submissionId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
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
      .in('submission_id', submissions.map(s => s.id));

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
      
      // Récupérer l'assignment
      const { data: assignment } = await supabase
        .from('module_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (!assignment) return;

      // Récupérer les soumissions
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('student_id')
        .eq('assignment_id', assignmentId);

      if (submissions) {
        // Notifier chaque étudiant qui a rendu le devoir
        for (const submission of submissions) {
          await notificationService.notifyUser(
            submission.student_id,
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
