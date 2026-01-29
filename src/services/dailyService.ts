import { supabase } from '@/integrations/supabase/client';

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  privacy: string;
  config: {
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
  };
}

export interface CreateRoomOptions {
  roomName: string;
  expiryMinutes?: number;
  maxParticipants?: number;
  enableRecording?: boolean;
  enableChat?: boolean;
  enableScreenShare?: boolean;
}

export interface CreateTokenOptions {
  roomName: string;
  userId: string;
  userName: string;
  isOwner?: boolean;
  expiryMinutes?: number;
}

/**
 * Create or get a Daily.co room for a virtual class
 */
export async function createDailyRoom(options: CreateRoomOptions): Promise<{ room: DailyRoom; url: string }> {
  const { data, error } = await supabase.functions.invoke('daily-room', {
    body: {
      ...options,
    },
  });

  if (error) {
    console.error('Error creating Daily room:', error);
    throw new Error(error.message || 'Failed to create room');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to create room');
  }

  return {
    room: data.room,
    url: data.url,
  };
}

/**
 * Create a meeting token for a participant
 */
export async function createDailyToken(options: CreateTokenOptions): Promise<string> {
  const { data, error } = await supabase.functions.invoke('daily-room/create-token', {
    body: options,
  });

  if (error) {
    console.error('Error creating Daily token:', error);
    throw new Error(error.message || 'Failed to create token');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to create token');
  }

  return data.token;
}

/**
 * Delete a Daily.co room
 */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('daily-room/delete-room', {
    body: { roomName },
  });

  if (error) {
    console.error('Error deleting Daily room:', error);
    throw new Error(error.message || 'Failed to delete room');
  }
}

/**
 * Get room information including participant count
 */
export async function getDailyRoomInfo(roomName: string): Promise<{
  room: DailyRoom;
  participantCount: number;
}> {
  const { data, error } = await supabase.functions.invoke('daily-room/room-info', {
    body: { roomName },
  });

  if (error) {
    console.error('Error getting room info:', error);
    throw new Error(error.message || 'Failed to get room info');
  }

  return {
    room: data.room,
    participantCount: data.participantCount,
  };
}

/**
 * Generate a unique room name for a virtual class
 */
export function generateRoomName(virtualClassId: string): string {
  // Create a URL-safe room name from the virtual class ID
  const sanitizedId = virtualClassId.replace(/-/g, '').substring(0, 20);
  return `vc-${sanitizedId}`;
}
