import { supabase } from '@/integrations/supabase/client';

export interface Tutor {
  id: string;
  establishment_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name: string;
  company_address?: string;
  position?: string;
  is_activated: boolean;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TutorStudentAssignment {
  id: string;
  tutor_id: string;
  student_id: string;
  assigned_at: string;
  is_active: boolean;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
}

export interface CreateTutorData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name: string;
  company_address?: string;
  position?: string;
  establishment_id: string;
}

export interface TutorWithStudents {
  tutor_id: string;
  tutor_first_name: string;
  tutor_last_name: string;
  tutor_email: string;
  company_name: string;
  position?: string;
  is_activated: boolean;
  student_id: string;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  is_active: boolean;
  formation_id?: string;
  formation_title?: string;
  formation_level?: string;
}

export const tutorService = {
  // Récupérer tous les tuteurs
  async getAllTutors(): Promise<Tutor[]> {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Créer un nouveau tuteur
  async createTutor(tutorData: CreateTutorData): Promise<Tutor> {
    const { data, error } = await supabase
      .from('tutors')
      .insert([tutorData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour un tuteur
  async updateTutor(id: string, tutorData: Partial<CreateTutorData>): Promise<Tutor> {
    const { data, error } = await supabase
      .from('tutors')
      .update(tutorData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer un tuteur
  async deleteTutor(id: string): Promise<void> {
    const { error } = await supabase
      .from('tutors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Récupérer un tuteur par ID
  async getTutorById(id: string): Promise<Tutor | null> {
    const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Assigner un étudiant à un tuteur
  async assignStudentToTutor(assignment: {
    tutor_id: string;
    student_id: string;
    contract_type?: string;
    contract_start_date?: string;
    contract_end_date?: string;
  }): Promise<TutorStudentAssignment> {
    const { data, error } = await supabase
      .from('tutor_student_assignments')
      .insert([assignment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer les assignations d'un tuteur
  async getTutorStudentAssignments(tutorId: string): Promise<TutorStudentAssignment[]> {
    const { data, error } = await supabase
      .from('tutor_student_assignments')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // Récupérer les tuteurs avec leurs étudiants
  async getTutorsWithStudents(): Promise<TutorWithStudents[]> {
    const { data, error } = await supabase
      .from('tutor_students_view')
      .select('*');

    if (error) throw error;
    return data || [];
  },

  // Désactiver une assignation
  async deactivateAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('tutor_student_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId);

    if (error) throw error;
  }
};