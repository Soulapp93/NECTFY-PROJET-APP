import { supabase } from '@/integrations/supabase/client';

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  establishment_id: string;
  created_by: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'ended' | 'cancelled';
  room_name: string | null;
  room_url: string | null;
  max_participants: number | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string | null;
  formation_id: string | null;
  participant_role: string | null;
  invitation_type: 'individual' | 'formation' | 'role';
  joined_at: string | null;
  left_at: string | null;
  created_at: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  max_participants?: number;
  participants: {
    type: 'individual' | 'formation' | 'role';
    userId?: string;
    formationId?: string;
    role?: string;
  }[];
}

const db = supabase as any;

export const meetingService = {
  async getMeetings(establishmentId: string): Promise<Meeting[]> {
    const { data, error } = await db
      .from('meetings')
      .select('*')
      .eq('establishment_id', establishmentId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUpcomingMeetings(establishmentId: string): Promise<Meeting[]> {
    const { data, error } = await db
      .from('meetings')
      .select('*')
      .eq('establishment_id', establishmentId)
      .in('status', ['scheduled', 'in_progress'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createMeeting(establishmentId: string, userId: string, meetingData: CreateMeetingData): Promise<Meeting> {
    // Create the meeting
    const { data: meeting, error: meetingError } = await db
      .from('meetings')
      .insert({
        title: meetingData.title,
        description: meetingData.description,
        establishment_id: establishmentId,
        created_by: userId,
        scheduled_at: meetingData.scheduled_at,
        duration_minutes: meetingData.duration_minutes,
        max_participants: meetingData.max_participants || 100,
      })
      .select()
      .single();

    if (meetingError) throw meetingError;

    // Add participants
    if (meetingData.participants.length > 0) {
      const participantsToInsert = meetingData.participants.map(p => ({
        meeting_id: meeting.id,
        user_id: p.type === 'individual' ? p.userId : null,
        formation_id: p.type === 'formation' ? p.formationId : null,
        participant_role: p.type === 'role' ? p.role : null,
        invitation_type: p.type,
      }));

      const { error: participantsError } = await db
        .from('meeting_participants')
        .insert(participantsToInsert);

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
      }
    }

    return meeting;
  },

  async updateMeetingStatus(meetingId: string, status: Meeting['status'], roomUrl?: string, roomName?: string): Promise<void> {
    const updateData: any = { status };
    if (roomUrl) updateData.room_url = roomUrl;
    if (roomName) updateData.room_name = roomName;

    const { error } = await db
      .from('meetings')
      .update(updateData)
      .eq('id', meetingId);

    if (error) throw error;
  },

  async deleteMeeting(meetingId: string): Promise<void> {
    const { error } = await db
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (error) throw error;
  },

  async getParticipants(meetingId: string): Promise<MeetingParticipant[]> {
    const { data, error } = await db
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId);

    if (error) throw error;
    return data || [];
  },

  async isUserInvited(meetingId: string, userId: string, userRole: string, userFormationIds: string[]): Promise<boolean> {
    const { data: participants, error } = await db
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId);

    if (error) return false;

    for (const p of participants || []) {
      if (p.invitation_type === 'individual' && p.user_id === userId) return true;
      if (p.invitation_type === 'role' && p.participant_role === userRole) return true;
      if (p.invitation_type === 'formation' && userFormationIds.includes(p.formation_id)) return true;
    }

    return false;
  },
};
