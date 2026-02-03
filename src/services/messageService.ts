import { supabase } from '@/integrations/supabase/client';

// Type helper for database operations on non-typed tables
const db = supabase as any;

export interface Message {
  id: string;
  sender_id: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
  scheduled_for?: string;
  is_draft: boolean;
  is_deleted?: boolean;
  deleted_at?: string;
  attachment_count: number;
}

export interface MessageRecipient {
  id: string;
  message_id: string;
  recipient_id?: string;
  recipient_type: 'user' | 'formation' | 'all_instructors';
  is_read: boolean;
  read_at?: string;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  content_type?: string;
  created_at: string;
}

export interface UploadedAttachment {
  file_name: string;
  file_url: string;
  file_size: number;
}

export interface CreateMessageData {
  subject: string;
  content: string;
  scheduledFor?: string;
  is_draft?: boolean;
  recipients: {
    type: 'user' | 'formation' | 'all_instructors';
    ids?: string[];
  };
  attachments?: File[] | UploadedAttachment[];
}

export const messageService = {
  /**
   * Send a message via the backend Edge Function to bypass RLS issues.
   */
  async createMessage(messageData: CreateMessageData): Promise<Message> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      // Upload files first and collect URLs
      let attachmentPayloads: Array<{
        file_name: string;
        file_url: string;
        file_size?: number;
        content_type?: string;
      }> = [];

      if (messageData.attachments && messageData.attachments.length > 0) {
        const firstAttachment = messageData.attachments[0];
        if (firstAttachment instanceof File) {
          // Upload to storage and build payload
          const files = messageData.attachments as File[];
          for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `messages/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('module-files')
              .upload(fileName, file);

            if (uploadError) {
              console.error('File upload error:', uploadError);
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('module-files').getPublicUrl(fileName);

            attachmentPayloads.push({
              file_name: file.name,
              file_url: publicUrl,
              file_size: file.size,
              content_type: file.type,
            });
          }
        } else {
          // Already uploaded attachments
          attachmentPayloads = (messageData.attachments as UploadedAttachment[]).map(att => ({
            file_name: att.file_name,
            file_url: att.file_url,
            file_size: att.file_size,
          }));
        }
      }

      // Call backend edge function
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: {
          subject: messageData.subject,
          content: messageData.content,
          is_draft: messageData.is_draft || false,
          scheduled_for: messageData.scheduledFor || null,
          recipients: messageData.recipients,
          attachments: attachmentPayloads,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erreur lors de l\'envoi du message');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur inconnue');
      }

      // IMPORTANT: Do NOT notify recipients immediately for scheduled messages.
      // Scheduled delivery is handled later by the backend scheduler (recipients + emails).
      const isScheduled = !!messageData.scheduledFor;
      if (!messageData.is_draft && !isScheduled) {
        // Notify recipients (fire and forget)
        this.notifyMessageRecipients(data.message, messageData.recipients).catch(console.error);
      }

      return data.message as Message;
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      throw error;
    }
  },

  async uploadAttachments(messageId: string, files: File[]): Promise<void> {
    try {
      const attachmentPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${messageId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('module-files')
          .upload(`messages/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('module-files')
          .getPublicUrl(`messages/${fileName}`);

        const { error: attachmentError } = await db
          .from('message_attachments')
          .insert({
            message_id: messageId,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            content_type: file.type
          });

        if (attachmentError) throw attachmentError;
      });

      await Promise.all(attachmentPromises);
    } catch (error) {
      console.error('Erreur lors du téléchargement des pièces jointes:', error);
      throw error;
    }
  },

  async saveUploadedAttachments(messageId: string, attachments: UploadedAttachment[]): Promise<void> {
    try {
      const attachmentRecords = attachments.map(att => ({
        message_id: messageId,
        file_name: att.file_name,
        file_url: att.file_url,
        file_size: att.file_size
      }));

      const { error } = await db
        .from('message_attachments')
        .insert(attachmentRecords);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des pièces jointes:', error);
      throw error;
    }
  },

  async getMessages(): Promise<Message[]> {
    try {
      const { data, error } = await db
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Message[];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  },

  async getMessageById(id: string): Promise<Message | null> {
    try {
      const { data, error } = await db
        .from('messages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Message | null;
    } catch (error) {
      console.error('Erreur lors de la récupération du message:', error);
      throw error;
    }
  },

  async markAsRead(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await db
        .from('message_recipients')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  },

  async notifyMessageRecipients(message: Message, recipients: CreateMessageData['recipients']) {
    try {
      const { notificationService } = await import('./notificationService');
      
      if (recipients.type === 'all_instructors') {
        await notificationService.notifyAllInstructors(
          'Nouveau message',
          `Vous avez reçu un nouveau message: "${message.subject}"`,
          'message',
          { message_id: message.id }
        );
      } else if (recipients.type === 'formation' && recipients.ids) {
        for (const formationId of recipients.ids) {
          await notificationService.notifyFormationUsers(
            formationId,
            'Nouveau message',
            `Vous avez reçu un nouveau message: "${message.subject}"`,
            'message',
            { message_id: message.id }
          );
        }
      } else if (recipients.type === 'user' && recipients.ids) {
        for (const userId of recipients.ids) {
          await notificationService.notifyUser(
            userId,
            'Nouveau message',
            `Vous avez reçu un nouveau message: "${message.subject}"`,
            'message',
            { message_id: message.id }
          );
        }
      }
    } catch (error) {
      console.error('Error sending message notifications:', error);
    }
  },

  async toggleFavorite(messageId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: current } = await db
        .from('message_recipients')
        .select('is_favorite')
        .eq('message_id', messageId)
        .eq('recipient_id', user.id)
        .single();

      const newStatus = !current?.is_favorite;

      const { error } = await db
        .from('message_recipients')
        .update({ is_favorite: newStatus })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
      return newStatus;
    } catch (error) {
      console.error('Erreur lors du toggle favoris:', error);
      throw error;
    }
  },

  async toggleArchive(messageId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: current } = await db
        .from('message_recipients')
        .select('is_archived')
        .eq('message_id', messageId)
        .eq('recipient_id', user.id)
        .single();

      const newStatus = !current?.is_archived;

      const { error } = await db
        .from('message_recipients')
        .update({ is_archived: newStatus })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
      return newStatus;
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      throw error;
    }
  },

  async moveToTrash(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await db
        .from('message_recipients')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  async restoreFromTrash(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await db
        .from('message_recipients')
        .update({ 
          is_deleted: false,
          deleted_at: null
        })
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      throw error;
    }
  },

  async permanentlyDelete(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await db
        .from('message_recipients')
        .delete()
        .eq('message_id', messageId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression définitive:', error);
      throw error;
    }
  },

  async deleteSentMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await db
        .from('messages')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  },

  async restoreSentMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await db
        .from('messages')
        .update({ 
          is_deleted: false,
          deleted_at: null
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      throw error;
    }
  },

  async permanentlyDeleteSentMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Delete attachments first
      await db
        .from('message_attachments')
        .delete()
        .eq('message_id', messageId);

      // Delete recipients
      await db
        .from('message_recipients')
        .delete()
        .eq('message_id', messageId);

      // Delete message
      const { error } = await db
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la suppression définitive:', error);
      throw error;
    }
  },

  async getMessageRecipientInfo(messageId: string): Promise<MessageRecipient | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await db
        .from('message_recipients')
        .select('*')
        .eq('message_id', messageId)
        .eq('recipient_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as MessageRecipient | null;
    } catch (error) {
      console.error('Erreur:', error);
      return null;
    }
  },

  async forwardMessage(originalMessageId: string, recipientIds: string[]): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const originalMessage = await this.getMessageById(originalMessageId);
      if (!originalMessage) throw new Error('Message original non trouvé');

      const { data: attachments } = await db
        .from('message_attachments')
        .select('*')
        .eq('message_id', originalMessageId);

      const { data: newMessage, error: messageError } = await db
        .from('messages')
        .insert({
          sender_id: user.id,
          subject: `Tr: ${originalMessage.subject}`,
          content: `---------- Message transféré ----------\n\n${originalMessage.content}`,
          is_draft: false,
          attachment_count: attachments?.length || 0
        })
        .select()
        .single();

      if (messageError) throw messageError;

      const recipients = recipientIds.map(id => ({
        message_id: newMessage.id,
        recipient_id: id,
        recipient_type: 'user' as const
      }));

      const { error: recipientsError } = await db
        .from('message_recipients')
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      if (attachments && attachments.length > 0) {
        const newAttachments = attachments.map((att: any) => ({
          message_id: newMessage.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_size: att.file_size,
          content_type: att.content_type
        }));

        await db.from('message_attachments').insert(newAttachments);
      }

      await this.notifyMessageRecipients(newMessage as Message, { type: 'user', ids: recipientIds });

      return newMessage as Message;
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
      throw error;
    }
  },

  async getMessagesWithRecipientInfo(): Promise<(Message & { recipientInfo?: MessageRecipient })[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: messages, error: messagesError } = await db
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const { data: recipientInfos } = await db
        .from('message_recipients')
        .select('*')
        .eq('recipient_id', user.id);

      const recipientMap = new Map(
        (recipientInfos || []).map((r: any) => [r.message_id, r as MessageRecipient])
      );

      return ((messages || []) as Message[]).map(msg => ({
        ...msg,
        recipientInfo: recipientMap.get(msg.id) as MessageRecipient | undefined
      })) as (Message & { recipientInfo?: MessageRecipient })[];
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  }
};
