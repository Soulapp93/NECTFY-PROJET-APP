import { supabase } from '@/integrations/supabase/client';

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
    ids?: string[]; // user_ids for individual, formation_ids for groups
  };
  attachments?: File[] | UploadedAttachment[];
}

export const messageService = {
  async createMessage(messageData: CreateMessageData): Promise<Message> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Create the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          subject: messageData.subject,
          content: messageData.content,
          scheduled_for: messageData.scheduledFor,
          is_draft: messageData.is_draft || false,
          attachment_count: messageData.attachments?.length || 0
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create recipients
      const recipients: Array<{
        message_id: string;
        recipient_id?: string;
        recipient_type: 'user' | 'formation' | 'all_instructors';
      }> = [];

      if (messageData.recipients.type === 'all_instructors') {
        recipients.push({
          message_id: message.id,
          recipient_type: 'all_instructors'
        });
      } else if (messageData.recipients.ids) {
        recipients.push(...messageData.recipients.ids.map(id => ({
          message_id: message.id,
          recipient_id: id,
          recipient_type: messageData.recipients.type
        })));
      }

      if (recipients.length > 0) {
        const { error: recipientsError } = await supabase
          .from('message_recipients')
          .insert(recipients);

        if (recipientsError) throw recipientsError;
      }

      // Handle attachments if any
      if (messageData.attachments && messageData.attachments.length > 0) {
        // Check if attachments are Files or already uploaded
        const firstAttachment = messageData.attachments[0];
        if (firstAttachment instanceof File) {
          await this.uploadAttachments(message.id, messageData.attachments as File[]);
        } else {
          // Already uploaded attachments
          await this.saveUploadedAttachments(message.id, messageData.attachments as UploadedAttachment[]);
        }
      }

      // Notifier les destinataires du nouveau message
      if (!messageData.is_draft) {
        await this.notifyMessageRecipients(message, messageData.recipients);
      }

      return message;
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      throw error;
    }
  },

  async uploadAttachments(messageId: string, files: File[]): Promise<void> {
    try {
      const attachmentPromises = files.map(async (file) => {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${messageId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('module-files') // Using existing bucket
          .upload(`messages/${fileName}`, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('module-files')
          .getPublicUrl(`messages/${fileName}`);

        // Save attachment record
        const { error: attachmentError } = await supabase
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

      const { error } = await supabase
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
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  },

  async getMessageById(id: string): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du message:', error);
      throw error;
    }
  },

  async markAsRead(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
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

  // Notifier les destinataires d'un nouveau message
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

      // Get current status
      const { data: current } = await supabase
        .from('message_recipients')
        .select('is_favorite')
        .eq('message_id', messageId)
        .eq('recipient_id', user.id)
        .single();

      const newStatus = !current?.is_favorite;

      const { error } = await supabase
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

  // Toggle archive status
  async toggleArchive(messageId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: current } = await supabase
        .from('message_recipients')
        .select('is_archived')
        .eq('message_id', messageId)
        .eq('recipient_id', user.id)
        .single();

      const newStatus = !current?.is_archived;

      const { error } = await supabase
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

  // Move to trash (soft delete)
  async moveToTrash(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
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

  // Restore from trash
  async restoreFromTrash(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
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

  // Permanently delete
  async permanentlyDelete(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
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

  // Delete sent message (for sender)
  async deleteSentMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
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

  // Restore sent message
  async restoreSentMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
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

  // Permanently delete sent message
  async permanentlyDeleteSentMessage(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Delete attachments first
      await supabase
        .from('message_attachments')
        .delete()
        .eq('message_id', messageId);

      // Delete recipients
      await supabase
        .from('message_recipients')
        .delete()
        .eq('message_id', messageId);

      // Delete message
      const { error } = await supabase
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

  // Get message recipient info for current user
  async getMessageRecipientInfo(messageId: string): Promise<MessageRecipient | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
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

  // Forward message to other users
  async forwardMessage(originalMessageId: string, recipientIds: string[]): Promise<Message> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get original message
      const originalMessage = await this.getMessageById(originalMessageId);
      if (!originalMessage) throw new Error('Message original non trouvé');

      // Get original attachments
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', originalMessageId);

      // Create forwarded message
      const { data: newMessage, error: messageError } = await supabase
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

      // Create recipients
      const recipients = recipientIds.map(id => ({
        message_id: newMessage.id,
        recipient_id: id,
        recipient_type: 'user' as const
      }));

      const { error: recipientsError } = await supabase
        .from('message_recipients')
        .insert(recipients);

      if (recipientsError) throw recipientsError;

      // Copy attachments if any
      if (attachments && attachments.length > 0) {
        const newAttachments = attachments.map(att => ({
          message_id: newMessage.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_size: att.file_size,
          content_type: att.content_type
        }));

        await supabase.from('message_attachments').insert(newAttachments);
      }

      // Notify recipients
      await this.notifyMessageRecipients(newMessage, { type: 'user', ids: recipientIds });

      return newMessage;
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
      throw error;
    }
  },

  // Get messages with recipient info
  async getMessagesWithRecipientInfo(): Promise<(Message & { recipientInfo?: MessageRecipient })[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      const { data: recipientInfos } = await supabase
        .from('message_recipients')
        .select('*')
        .eq('recipient_id', user.id);

      const recipientMap = new Map(
        (recipientInfos || []).map(r => [r.message_id, r as MessageRecipient])
      );

      return (messages || []).map(msg => ({
        ...msg,
        recipientInfo: recipientMap.get(msg.id)
      })) as (Message & { recipientInfo?: MessageRecipient })[];
    } catch (error) {
      console.error('Erreur:', error);
      throw error;
    }
  }
};