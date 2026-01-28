import { useState, useEffect, useCallback, useRef } from 'react';
import { virtualClassChatService, ChatMessage } from '@/services/elearning/virtualClassChatService';

interface UseVirtualClassChatOptions {
  classId: string;
  userId: string;
}

export const useVirtualClassChat = ({ classId, userId }: UseVirtualClassChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const initialMessages = await virtualClassChatService.getMessages(classId);
      setMessages(initialMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  // Subscribe to new messages
  useEffect(() => {
    loadMessages();

    const cleanup = virtualClassChatService.subscribeToChat(classId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      
      // Increment unread count if chat is closed and message is from someone else
      if (!isChatOpen && newMessage.sender_id !== userId) {
        setUnreadCount(prev => prev + 1);
      }
    });

    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [classId, userId, loadMessages, isChatOpen]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Send a message
  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'file' = 'text', fileUrl?: string, fileName?: string) => {
    if (!content.trim()) return null;

    const message = await virtualClassChatService.sendMessage(
      classId,
      userId,
      content,
      messageType,
      fileUrl,
      fileName
    );

    return message;
  }, [classId, userId]);

  // Toggle pin on a message
  const togglePin = useCallback(async (messageId: string, isPinned: boolean) => {
    await virtualClassChatService.togglePin(messageId, isPinned);
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, is_pinned: isPinned } : msg
      )
    );
  }, []);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    await virtualClassChatService.deleteMessage(messageId);
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Get pinned messages
  const pinnedMessages = messages.filter(msg => msg.is_pinned);

  return {
    messages,
    pinnedMessages,
    isLoading,
    unreadCount,
    isChatOpen,
    setIsChatOpen,
    sendMessage,
    togglePin,
    deleteMessage,
    refreshMessages: loadMessages,
  };
};
