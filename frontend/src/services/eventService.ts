import { supabase } from "@/integrations/supabase/client";

export interface Event {
  id: string;
  establishment_id: string;
  title: string;
  description?: string;
  category: string;
  location?: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  max_participants?: number;
  image_url?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  category: string;
  location?: string;
  start_date: string;
  start_time: string;
  end_date?: string;
  end_time?: string;
  max_participants?: number;
  image_url?: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: 'Confirmée' | 'En attente' | 'Annulée';
}

export const eventService = {
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    return data || [];
  },

  async getEventById(eventId: string): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }

    return data;
  },

  async createEvent(eventData: CreateEventData): Promise<Event> {
    // Get current user's establishment
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('establishment_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData?.establishment_id) {
      throw new Error('Could not get user establishment');
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...eventData,
        establishment_id: userData.establishment_id,
        created_by: session.user.id,
        status: 'Ouvert'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return data;
  },

  async updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({
        ...eventData,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    return data;
  },

  async deleteEvent(eventId: string): Promise<void> {
    // First delete related registrations
    await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId);

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  async registerForEvent(eventId: string): Promise<EventRegistration> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existing) {
      throw new Error('Already registered for this event');
    }

    const { data, error } = await supabase
      .from('event_registrations')
      .insert([{
        event_id: eventId,
        user_id: session.user.id,
        status: 'Confirmée'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error registering for event:', error);
      throw error;
    }

    return data as EventRegistration;
  },

  async unregisterFromEvent(eventId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    }
  },

  async getEventRegistrations(eventId: string) {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        users:user_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event registrations:', error);
      return [];
    }

    return data || [];
  }
};
