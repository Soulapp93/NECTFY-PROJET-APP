import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const db = supabase as any;

export interface WebRTCSignal {
  id: string;
  virtual_class_id: string;
  sender_id: string;
  receiver_id: string | null;
  signal_type: 'offer' | 'answer' | 'ice-candidate' | 'renegotiate' | 'leave' | 'mute' | 'unmute' | 'video-on' | 'video-off' | 'hand-raise' | 'hand-lower';
  signal_data: any;
  created_at: string;
}

export interface Participant {
  id: string;
  user_id: string;
  virtual_class_id: string;
  status: string;
  is_muted: boolean;
  is_video_off: boolean;
  is_hand_raised: boolean;
  role: 'host' | 'co-host' | 'participant';
  joined_at: string | null;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
  };
}

class WebRTCSignalingService {
  private channel: RealtimeChannel | null = null;
  private signalHandlers: ((signal: WebRTCSignal) => void)[] = [];
  private participantHandlers: ((participants: Participant[]) => void)[] = [];

  // Subscribe to WebRTC signals for a class
  subscribeToClass(
    classId: string, 
    userId: string,
    onSignal: (signal: WebRTCSignal) => void,
    onParticipantChange: (participants: Participant[]) => void
  ): () => void {
    this.signalHandlers.push(onSignal);
    this.participantHandlers.push(onParticipantChange);

    // Subscribe to signals channel
    this.channel = supabase
      .channel(`webrtc-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `virtual_class_id=eq.${classId}`,
        },
        (payload: any) => {
          const signal = payload.new as WebRTCSignal;
          // Only process signals meant for us or broadcast
          if (signal.receiver_id === null || signal.receiver_id === userId) {
            if (signal.sender_id !== userId) {
              onSignal(signal);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'virtual_class_participants',
          filter: `virtual_class_id=eq.${classId}`,
        },
        async () => {
          // Refresh participants list
          const participants = await this.getParticipants(classId);
          onParticipantChange(participants);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      this.unsubscribe();
    };
  }

  unsubscribe() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.signalHandlers = [];
    this.participantHandlers = [];
  }

  // Send a signal to a specific peer or broadcast
  async sendSignal(
    classId: string,
    senderId: string,
    receiverId: string | null,
    signalType: WebRTCSignal['signal_type'],
    signalData: any
  ): Promise<void> {
    const { error } = await db
      .from('webrtc_signals')
      .insert({
        virtual_class_id: classId,
        sender_id: senderId,
        receiver_id: receiverId,
        signal_type: signalType,
        signal_data: signalData,
      });

    if (error) {
      console.error('Error sending signal:', error);
      throw error;
    }
  }

  // Get current participants in a class
  async getParticipants(classId: string): Promise<Participant[]> {
    const { data, error } = await db
      .from('virtual_class_participants')
      .select(`
        *,
        user:users!user_id(id, first_name, last_name, profile_photo_url)
      `)
      .eq('virtual_class_id', classId)
      .in('status', ['Inscrit', 'Présent']);

    if (error) {
      console.error('Error fetching participants:', error);
      return [];
    }

    return data || [];
  }

  // Join a class as participant
  async joinClass(classId: string, userId: string): Promise<Participant | null> {
    // Check if already joined
    const { data: existing } = await db
      .from('virtual_class_participants')
      .select('*')
      .eq('virtual_class_id', classId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update status to present
      const { data, error } = await db
        .from('virtual_class_participants')
        .update({ 
          status: 'Présent', 
          joined_at: new Date().toISOString(),
          left_at: null
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Insert new participant
    const { data, error } = await db
      .from('virtual_class_participants')
      .insert({
        virtual_class_id: classId,
        user_id: userId,
        status: 'Présent',
        joined_at: new Date().toISOString(),
        role: 'participant'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Leave a class
  async leaveClass(classId: string, userId: string): Promise<void> {
    // Send leave signal
    await this.sendSignal(classId, userId, null, 'leave', { userId });

    // Update participant status
    await db
      .from('virtual_class_participants')
      .update({ 
        status: 'Absent',
        left_at: new Date().toISOString()
      })
      .eq('virtual_class_id', classId)
      .eq('user_id', userId);

    // Delete old signals from this user
    await db
      .from('webrtc_signals')
      .delete()
      .eq('virtual_class_id', classId)
      .eq('sender_id', userId);
  }

  // Update participant state (mute, video, hand)
  async updateParticipantState(
    classId: string,
    userId: string,
    updates: Partial<Pick<Participant, 'is_muted' | 'is_video_off' | 'is_hand_raised'>>
  ): Promise<void> {
    await db
      .from('virtual_class_participants')
      .update(updates)
      .eq('virtual_class_id', classId)
      .eq('user_id', userId);

    // Broadcast state change
    if (updates.is_muted !== undefined) {
      await this.sendSignal(classId, userId, null, updates.is_muted ? 'mute' : 'unmute', { userId });
    }
    if (updates.is_video_off !== undefined) {
      await this.sendSignal(classId, userId, null, updates.is_video_off ? 'video-off' : 'video-on', { userId });
    }
    if (updates.is_hand_raised !== undefined) {
      await this.sendSignal(classId, userId, null, updates.is_hand_raised ? 'hand-raise' : 'hand-lower', { userId });
    }
  }

  // Clean up old signals (called periodically)
  async cleanupOldSignals(classId: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await db
      .from('webrtc_signals')
      .delete()
      .eq('virtual_class_id', classId)
      .lt('created_at', oneHourAgo);
  }
}

export const webrtcSignalingService = new WebRTCSignalingService();
