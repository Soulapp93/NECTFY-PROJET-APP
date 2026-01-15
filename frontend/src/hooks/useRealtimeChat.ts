import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export interface ChatMessage {
  id: string;
  user_id: string;
  virtual_class_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  is_instructor?: boolean;
}

export const useRealtimeChat = (classId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user_id: 'instructor_1',
      virtual_class_id: classId,
      content: 'Bonjour à tous, nous commençons dans 2 minutes',
      created_at: new Date().toISOString(),
      sender_name: 'Formateur Prof',
      is_instructor: true
    },
    {
      id: '2',
      user_id: 'student_1',
      virtual_class_id: classId,
      content: 'Merci, nous sommes prêts',
      created_at: new Date().toISOString(),
      sender_name: 'Marie Dupont',
      is_instructor: false
    }
  ]);
  const [isConnected] = useState(true);
  const [isLoading] = useState(false);
  const { toast } = useToast();

  // Send a new message (mock implementation)
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    try {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        user_id: 'current_user',
        virtual_class_id: classId,
        content: messageText.trim(),
        created_at: new Date().toISOString(),
        sender_name: 'Vous',
        is_instructor: false
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  }, [classId, toast]);

  const refetchMessages = useCallback(() => {
    // Mock implementation - messages are already loaded
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    refetchMessages
  };
};