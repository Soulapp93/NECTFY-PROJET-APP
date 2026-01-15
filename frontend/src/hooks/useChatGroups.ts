import { useState, useEffect } from 'react';
import { chatService, ChatGroup, ChatMessage } from '@/services/chatService';
import { useToast } from './use-toast';

export const useChatGroups = () => {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      console.log('🔄 Fetching chat groups...');
      setLoading(true);
      setError(null);
      const data = await chatService.getUserGroups();
      console.log('✅ Chat groups fetched:', data.length, 'groups');
      setGroups(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des groupes';
      console.error('❌ Error fetching chat groups:', err);
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const createGroup = async (groupData: {
    name: string;
    description?: string;
    formation_id?: string;
    member_ids: string[];
  }) => {
    try {
      const newGroup = await chatService.createGroup(groupData);
      await fetchGroups();
      toast({
        title: "Succès",
        description: "Groupe créé avec succès",
      });
      return newGroup;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du groupe';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      await chatService.leaveGroup(groupId);
      await fetchGroups();
      toast({
        title: "Succès",
        description: "Vous avez quitté le groupe",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sortie du groupe';
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
    createGroup,
    leaveGroup,
  };
};

export const useChatMessages = (groupId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await chatService.getGroupMessages(groupId);
        setMessages(data);
        // Mark as read
        await chatService.updateLastRead(groupId);
      } catch (err) {
        console.error('Error loading messages:', err);
        toast({
          title: "Erreur",
          description: "Impossible de charger les messages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = chatService.subscribeToMessages(groupId, (newMessage) => {
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          // Update existing message (for deletions)
          return prev.map(msg => msg.id === newMessage.id ? newMessage : msg);
        }
        // Add new message
        return [...prev, newMessage];
      });
      // Mark as read if user is viewing this chat
      chatService.updateLastRead(groupId);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [groupId]);

  const sendMessage = async (content: string, repliedToMessageId?: string | null) => {
    if (!groupId || !content.trim()) return;

    try {
      await chatService.sendMessage(groupId, content, repliedToMessageId);
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!groupId) return;
    
    try {
      await chatService.deleteMessage(messageId);
      toast({
        title: "Succès",
        description: "Message supprimé",
      });
    } catch (err) {
      console.error('Error deleting message:', err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de supprimer le message",
        variant: "destructive",
      });
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
  };
};
