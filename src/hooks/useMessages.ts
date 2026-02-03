import { useState, useEffect, useCallback, useRef } from 'react';
import { messageService, Message, MessageRecipient } from '@/services/messageService';
import { supabase } from '@/integrations/supabase/client';

export interface MessageWithRecipientInfo extends Message {
  recipientInfo?: MessageRecipient;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<MessageWithRecipientInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await messageService.getMessagesWithRecipientInfo();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup realtime subscriptions
  useEffect(() => {
    // Initial fetch
    fetchMessages();

    // Subscribe to realtime changes on messages and message_recipients tables
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Messages realtime update:', payload.eventType);
          // Refetch all messages to get complete data with recipient info
          fetchMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_recipients'
        },
        (payload) => {
          console.log('Message recipients realtime update:', payload.eventType);
          // Refetch to update recipient info (read status, favorites, etc.)
          fetchMessages();
        }
      )
      .subscribe((status) => {
        console.log('Messages realtime subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchMessages]);

  const markAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === messageId && m.recipientInfo 
          ? { ...m, recipientInfo: { ...m.recipientInfo, is_read: true, read_at: new Date().toISOString() } }
          : m
      ));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const sendMessage = async (messageData: any) => {
    try {
      const normalizedData = {
        subject: messageData.subject,
        content: messageData.content,
        recipients: messageData.recipients,
        attachments: messageData.attachments,
        is_draft: messageData.is_draft,
        scheduledFor: messageData.scheduled_for || messageData.scheduledFor,
      };
      
      const newMessage = await messageService.createMessage(normalizedData);
      
      // Optimistic update - add to local state immediately
      setMessages(prev => [newMessage as MessageWithRecipientInfo, ...prev]);
      
      // Also trigger a refetch to ensure consistency
      fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message');
      throw err;
    }
  };

  const toggleFavorite = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === messageId && m.recipientInfo 
          ? { ...m, recipientInfo: { ...m.recipientInfo, is_favorite: !m.recipientInfo.is_favorite } }
          : m
      ));
      await messageService.toggleFavorite(messageId);
    } catch (err) {
      // Revert on error
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const toggleArchive = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === messageId && m.recipientInfo 
          ? { ...m, recipientInfo: { ...m.recipientInfo, is_archived: !m.recipientInfo.is_archived } }
          : m
      ));
      await messageService.toggleArchive(messageId);
    } catch (err) {
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const moveToTrash = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === messageId && m.recipientInfo 
          ? { ...m, recipientInfo: { ...m.recipientInfo, is_deleted: true, deleted_at: new Date().toISOString() } }
          : m
      ));
      await messageService.moveToTrash(messageId);
    } catch (err) {
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const restoreFromTrash = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === messageId && m.recipientInfo 
          ? { ...m, recipientInfo: { ...m.recipientInfo, is_deleted: false, deleted_at: null } }
          : m
      ));
      await messageService.restoreFromTrash(messageId);
    } catch (err) {
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const permanentlyDelete = async (messageId: string) => {
    try {
      // Optimistic update - remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await messageService.permanentlyDelete(messageId);
    } catch (err) {
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const deleteSentMessage = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, is_deleted: true, deleted_at: new Date().toISOString() }
          : m
      ));
      await messageService.deleteSentMessage(messageId);
    } catch (err) {
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const restoreSentMessage = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, is_deleted: false, deleted_at: undefined }
          : m
      ));
      await messageService.restoreSentMessage(messageId);
    } catch (err) {
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const permanentlyDeleteSentMessage = async (messageId: string) => {
    try {
      // Optimistic update - remove from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await messageService.permanentlyDeleteSentMessage(messageId);
    } catch (err) {
      await fetchMessages();
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const forwardMessage = async (messageId: string, recipientIds: string[]) => {
    try {
      const forwardedMessage = await messageService.forwardMessage(messageId, recipientIds);
      // Optimistic update
      setMessages(prev => [forwardedMessage as MessageWithRecipientInfo, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    toggleFavorite,
    toggleArchive,
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete,
    deleteSentMessage,
    restoreSentMessage,
    permanentlyDeleteSentMessage,
    forwardMessage,
    refetch: fetchMessages
  };
};
