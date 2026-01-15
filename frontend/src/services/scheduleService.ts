import { supabase } from '@/integrations/supabase/client';

export interface Schedule {
  id: string;
  formation_id: string;
  title: string;
  academic_year: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  formations?: {
    title: string;
    color: string;
  };
}

export interface ScheduleSlot {
  id: string;
  schedule_id: string;
  module_id?: string;
  instructor_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  room?: string;
  color?: string;
  notes?: string;
  session_type?: string; // 'encadree' | 'autonomie'
  created_at: string;
  updated_at: string;
  formation_modules?: {
    title: string;
  };
  users?: {
    first_name: string;
    last_name: string;
  };
}

export const scheduleService = {
  // Get all schedules
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        formations(title, color)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get schedule by ID
  async getScheduleById(id: string): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        formations(title, color)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  // Create new schedule
  async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert([schedule])
      .select(`
        *,
        formations(title, color)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update schedule
  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        formations(title, color)
      `)
      .single();

    if (error) throw error;

    // Si l'emploi du temps est publié pour la première fois, notifier
    if (updates.status === 'Publié') {
      await this.notifySchedulePublication(data);
    } else if (data.status === 'Publié') {
      // Si l'emploi du temps est déjà publié et qu'il y a des modifications, notifier
      await this.notifyScheduleUpdate(data);
    }

    return data;
  },

  // Delete schedule
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get schedule slots
  async getScheduleSlots(scheduleId: string): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users(first_name, last_name)
      `)
      .eq('schedule_id', scheduleId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return (data || []) as ScheduleSlot[];
  },

  // Create schedule slot
  async createScheduleSlot(slot: Omit<ScheduleSlot, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduleSlot> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .insert([slot])
      .select(`
        *,
        formation_modules(title),
        users(first_name, last_name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Update schedule slot
  async updateScheduleSlot(id: string, updates: Partial<ScheduleSlot>): Promise<ScheduleSlot> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        formation_modules(title),
        users(first_name, last_name)
      `)
      .single();

    if (error) throw error;

    // Récupérer l'emploi du temps pour vérifier s'il faut notifier
    const { data: scheduleData } = await supabase
      .from('schedules')
      .select(`
        *,
        formations(title, color)
      `)
      .eq('id', data.schedule_id)
      .single();

    // Si l'emploi du temps est publié, notifier les modifications
    if (scheduleData && scheduleData.status === 'Publié') {
      await this.notifyScheduleUpdate(scheduleData);
    }

    return data;
  },

  // Delete schedule slot
  async deleteScheduleSlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get published schedules for student by formation IDs
  async getStudentSchedules(formationIds: string[]): Promise<ScheduleSlot[]> {
    if (!formationIds || formationIds.length === 0) return [];

    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users(first_name, last_name),
        schedules!inner(
          id,
          formation_id,
          title,
          academic_year,
          status,
          formations(title, color)
        )
      `)
      .in('schedules.formation_id', formationIds)
      .eq('schedules.status', 'Publié')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get published schedules for instructor
  async getInstructorSchedules(instructorId: string): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users(first_name, last_name),
        schedules!inner(
          id,
          formation_id,
          title,
          academic_year,
          status,
          formations(title, color)
        )
      `)
      .eq('instructor_id', instructorId)
      .eq('schedules.status', 'Publié')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get all published schedules (for testing when user has no formations)
  async getAllPublishedSchedules(): Promise<ScheduleSlot[]> {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        formation_modules(title),
        users(first_name, last_name),
        schedules!inner(
          id,
          formation_id,
          title,
          academic_year,
          status,
          formations(title, color)
        )
      `)
      .eq('schedules.status', 'Publié')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Notifier les utilisateurs lors de la publication d'un emploi du temps
  async notifySchedulePublication(schedule: Schedule) {
    try {
      const { notificationService } = await import('./notificationService');
      
      await notificationService.notifyFormationUsers(
        schedule.formation_id,
        'Nouvel emploi du temps publié',
        `L'emploi du temps "${schedule.title}" a été publié et est maintenant disponible.`,
        'schedule_published',
        { schedule_id: schedule.id }
      );
    } catch (error) {
      console.error('Error sending schedule publication notifications:', error);
      // Ne pas faire échouer la publication si les notifications échouent
    }
  },

  // Notifier les utilisateurs lors de modifications d'un emploi du temps
  async notifyScheduleUpdate(schedule: Schedule) {
    try {
      const { notificationService } = await import('./notificationService');
      
      await notificationService.notifyFormationUsers(
        schedule.formation_id,
        'Emploi du temps modifié',
        `L'emploi du temps "${schedule.title}" a été modifié. Veuillez consulter les nouvelles informations.`,
        'schedule_update',
        { schedule_id: schedule.id }
      );
    } catch (error) {
      console.error('Error sending schedule update notifications:', error);
      // Ne pas faire échouer la modification si les notifications échouent
    }
  }
};