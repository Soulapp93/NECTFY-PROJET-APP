import { useState, useEffect } from 'react';
import { messageService, Message, MessageRecipient } from '@/services/messageService';

export interface MessageWithRecipientInfo extends Message {
  recipientInfo?: MessageRecipient;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<MessageWithRecipientInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
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
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
      await fetchMessages();
    } catch (err) {
      // Silently handle - not critical
      console.error('Error marking as read:', err);
    }
  };

  const sendMessage = async (messageData: any) => {
    try {
      await messageService.createMessage(messageData);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message');
      throw err;
    }
  };

  const toggleFavorite = async (messageId: string) => {
    try {
      await messageService.toggleFavorite(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const toggleArchive = async (messageId: string) => {
    try {
      await messageService.toggleArchive(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const moveToTrash = async (messageId: string) => {
    try {
      await messageService.moveToTrash(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const restoreFromTrash = async (messageId: string) => {
    try {
      await messageService.restoreFromTrash(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const permanentlyDelete = async (messageId: string) => {
    try {
      await messageService.permanentlyDelete(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const deleteSentMessage = async (messageId: string) => {
    try {
      await messageService.deleteSentMessage(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const restoreSentMessage = async (messageId: string) => {
    try {
      await messageService.restoreSentMessage(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const permanentlyDeleteSentMessage = async (messageId: string) => {
    try {
      await messageService.permanentlyDeleteSentMessage(messageId);
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      throw err;
    }
  };

  const forwardMessage = async (messageId: string, recipientIds: string[]) => {
    try {
      await messageService.forwardMessage(messageId, recipientIds);
      await fetchMessages();
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
