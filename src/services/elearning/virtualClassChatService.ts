import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

const db = supabase as any;

export interface ChatMessage {
  id: string;
  virtual_class_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  is_pinned: boolean;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
  };
}

class VirtualClassChatService {
  private channel: RealtimeChannel | null = null;

  // Subscribe to chat messages for a class
  subscribeToChat(
    classId: string,
    onMessage: (message: ChatMessage) => void
  ): () => void {
    this.channel = supabase
      .channel(`chat-${classId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'virtual_class_messages',
          filter: `virtual_class_id=eq.${classId}`,
        },
        async (payload: any) => {
          // Fetch complete message with sender info
          const { data } = await db
            .from('virtual_class_messages')
            .select(`
              *,
              sender:users!sender_id(id, first_name, last_name, profile_photo_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onMessage(data as ChatMessage);
          }
        }
      )
      .subscribe();

    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  // Get chat messages for a class
  async getMessages(classId: string, limit: number = 100): Promise<ChatMessage[]> {
    const { data, error } = await db
      .from('virtual_class_messages')
      .select(`
        *,
        sender:users!sender_id(id, first_name, last_name, profile_photo_url)
      `)
      .eq('virtual_class_id', classId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  }

  // Send a chat message
  async sendMessage(
    classId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'file' | 'system' = 'text',
    fileUrl?: string,
    fileName?: string
  ): Promise<ChatMessage | null> {
    const { data, error } = await db
      .from('virtual_class_messages')
      .insert({
        virtual_class_id: classId,
        sender_id: senderId,
        content,
        message_type: messageType,
        file_url: fileUrl,
        file_name: fileName,
      })
      .select(`
        *,
        sender:users!sender_id(id, first_name, last_name, profile_photo_url)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data as ChatMessage;
  }

  // Toggle pin status of a message
  async togglePin(messageId: string, isPinned: boolean): Promise<void> {
    await db
      .from('virtual_class_messages')
      .update({ is_pinned: isPinned })
      .eq('id', messageId);
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    await db
      .from('virtual_class_messages')
      .delete()
      .eq('id', messageId);
  }
}

export const virtualClassChatService = new VirtualClassChatService();
