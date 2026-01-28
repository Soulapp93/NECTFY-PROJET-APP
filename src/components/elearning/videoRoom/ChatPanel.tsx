import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Pin, Trash2, MoreVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/services/elearning/virtualClassChatService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatPanelProps {
  messages: ChatMessage[];
  pinnedMessages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
  onDeleteMessage?: (messageId: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  pinnedMessages,
  currentUserId,
  onSendMessage,
  onTogglePin,
  onDeleteMessage,
  onClose,
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(inputValue.trim());
      setInputValue('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="p-2 bg-warning/10 border-b">
          <div className="flex items-center gap-1 text-xs text-warning font-medium mb-1">
            <Pin className="h-3 w-3" />
            Messages épinglés
          </div>
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="text-xs text-muted-foreground truncate">
              <span className="font-medium">{msg.sender?.first_name}:</span> {msg.content}
            </div>
          ))}
        </div>
      )}

      {/* Messages List */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const senderName = message.sender 
              ? `${message.sender.first_name} ${message.sender.last_name}`
              : 'Utilisateur';
            const initials = message.sender 
              ? `${message.sender.first_name?.[0] || ''}${message.sender.last_name?.[0] || ''}`
              : 'U';

            return (
              <div 
                key={message.id} 
                className={cn(
                  "flex gap-2 group",
                  isOwn && "flex-row-reverse"
                )}
              >
                {!isOwn && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.sender?.profile_photo_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("max-w-[80%]", isOwn && "text-right")}>
                  {!isOwn && (
                    <span className="text-xs text-muted-foreground font-medium">{senderName}</span>
                  )}
                  
                  <div className={cn(
                    "relative rounded-lg px-3 py-2 mt-0.5",
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                    message.is_pinned && "ring-1 ring-warning"
                  )}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    
                    {message.file_url && (
                      <a 
                        href={message.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs underline mt-1"
                      >
                        <Paperclip className="h-3 w-3" />
                        {message.file_name || 'Pièce jointe'}
                      </a>
                    )}

                    {/* Message actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "absolute -right-1 -top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                            isOwn && "-left-1 -right-auto"
                          )}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isOwn ? "start" : "end"}>
                        {onTogglePin && (
                          <DropdownMenuItem onClick={() => onTogglePin(message.id, !message.is_pinned)}>
                            <Pin className="h-4 w-4 mr-2" />
                            {message.is_pinned ? 'Désépingler' : 'Épingler'}
                          </DropdownMenuItem>
                        )}
                        {isOwn && onDeleteMessage && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => onDeleteMessage(message.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Aucun message. Soyez le premier à écrire !
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Écrire un message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
