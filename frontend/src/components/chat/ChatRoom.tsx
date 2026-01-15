import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon, File, Reply, Trash2, MoreVertical, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useChatMessages } from '@/hooks/useChatGroups';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { chatService } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/services/chatService';
import FileViewerModal from './FileViewerModal';

interface ChatRoomProps {
  groupId: string;
  groupName: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ groupId, groupName }) => {
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);
  const { messages, loading, sendMessage, deleteMessage } = useChatMessages(groupId);
  const { userId } = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [messageText]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;
    
    try {
      setUploading(true);
      
      // Determine message content
      let content = messageText.trim();
      if (!content && selectedFiles.length > 0) {
        // If only files, create a descriptive message
        const fileNames = selectedFiles.map(f => f.name).join(', ');
        content = `📎 ${fileNames}`;
      }
      
      // Send the message
      const message = await chatService.sendMessage(
        groupId, 
        content,
        replyingTo?.id || null
      );
      
      // Upload all attachments
      if (selectedFiles.length > 0) {
        await Promise.all(
          selectedFiles.map(file => chatService.uploadAttachment(message.id, file))
        );
      }
      
      setMessageText('');
      setSelectedFiles([]);
      setReplyingTo(null);
      
      toast({
        title: "Message envoyé",
        description: selectedFiles.length > 0 ? `${selectedFiles.length} fichier(s) joint(s)` : undefined,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  };

  const handleDelete = async (messageId: string) => {
    if (deleteMessage) {
      await deleteMessage(messageId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (contentType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const isImage = (contentType: string) => contentType.startsWith('image/');
  const isPDF = (contentType: string) => contentType.includes('pdf');
  
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Téléchargement démarré",
        description: fileName,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };
  
  const handleViewFile = (fileUrl: string, fileName: string) => {
    setViewerFile({ url: fileUrl, name: fileName });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header */}
      <div className="border-b border-primary/10 p-4 bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg ring-2 ring-primary/20">
            <span className="text-xl font-bold text-primary-foreground">{groupName[0]}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{groupName}</h2>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs text-muted-foreground">{messages.length} messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-transparent to-muted/5" ref={scrollRef}>
        {loading && messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-md">
              <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <p className="text-muted-foreground font-medium">Chargement des messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-md max-w-sm">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <p className="text-foreground font-semibold mb-1">Aucun message</p>
              <p className="text-muted-foreground text-sm">Soyez le premier à écrire !</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_id === userId;
              const senderName = message.sender
                ? `${message.sender.first_name} ${message.sender.last_name}`
                : 'Utilisateur';
              const initials = message.sender
                ? `${message.sender.first_name[0]}${message.sender.last_name[0]}`
                : 'U';

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3 animate-fade-in group',
                    isOwnMessage && 'flex-row-reverse'
                  )}
                >
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                    <AvatarImage src={message.sender?.profile_photo_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'flex flex-col max-w-[75%] relative',
                      isOwnMessage && 'items-end'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-medium text-foreground">
                        {isOwnMessage ? 'Vous' : senderName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 relative">
                      {/* Reply Preview */}
                      {message.replied_to_message && (
                        <div className={cn(
                          "text-xs px-3 py-1.5 rounded-lg border-l-2 bg-muted/50",
                          isOwnMessage ? "border-primary-foreground/30" : "border-primary/30"
                        )}>
                          <p className="font-medium text-muted-foreground">
                            {message.replied_to_message.sender?.first_name || 'Utilisateur'}
                          </p>
                          <p className="text-muted-foreground/80 truncate">
                            {message.replied_to_message.content.substring(0, 50)}
                            {message.replied_to_message.content.length > 50 && '...'}
                          </p>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 shadow-sm flex-1',
                            message.is_deleted 
                              ? 'bg-muted text-muted-foreground italic'
                              : isOwnMessage
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-card text-foreground border border-border/50 rounded-tl-sm'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </p>
                        </div>

                        {/* Message Actions */}
                        {!message.is_deleted && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                              <DropdownMenuItem onClick={() => handleReply(message)}>
                                <Reply className="h-4 w-4 mr-2" />
                                Répondre
                              </DropdownMenuItem>
                              {isOwnMessage && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(message.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          {message.attachments.map((attachment) => {
                            const contentType = attachment.content_type || '';
                            
                            // Image preview
                            if (isImage(contentType)) {
                              return (
                                <div
                                  key={attachment.id}
                                  className="relative group rounded-xl overflow-hidden max-w-[300px]"
                                >
                                  <img 
                                    src={attachment.file_url} 
                                    alt={attachment.file_name}
                                    className="w-full h-auto rounded-xl shadow-md"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 w-8 p-0 rounded-full"
                                      onClick={() => handleViewFile(attachment.file_url, attachment.file_name)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 w-8 p-0 rounded-full"
                                      onClick={() => handleDownloadFile(attachment.file_url, attachment.file_name)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            }
                            
                            // PDF preview
                            if (isPDF(contentType)) {
                              return (
                                <div
                                  key={attachment.id}
                                  className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm border-l-4 cursor-pointer group',
                                    isOwnMessage
                                      ? 'bg-primary/80 text-primary-foreground border-primary-foreground/30 hover:bg-primary/90'
                                      : 'bg-card text-foreground border-primary/50 hover:bg-card/80'
                                  )}
                                  onClick={() => handleViewFile(attachment.file_url, attachment.file_name)}
                                >
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    isOwnMessage ? "bg-primary-foreground/20" : "bg-primary/10"
                                  )}>
                                    <FileText className="h-6 w-6" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {attachment.file_name}
                                    </p>
                                    {attachment.file_size && (
                                      <p className="text-xs opacity-70">
                                        PDF • {Math.round(attachment.file_size / 1024)} KB
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadFile(attachment.file_url, attachment.file_name);
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            }
                            
                            // Other files
                            return (
                              <div
                                key={attachment.id}
                                className={cn(
                                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm cursor-pointer group',
                                  isOwnMessage
                                    ? 'bg-primary/80 text-primary-foreground hover:bg-primary/90'
                                    : 'bg-card/80 text-foreground border border-border/50 hover:bg-card'
                                )}
                                onClick={() => handleViewFile(attachment.file_url, attachment.file_name)}
                              >
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isOwnMessage ? "bg-primary-foreground/20" : "bg-muted"
                                )}>
                                  {getFileIcon(contentType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm">
                                    {attachment.file_name}
                                  </p>
                                  {attachment.file_size && (
                                    <p className="text-xs opacity-70">
                                      {Math.round(attachment.file_size / 1024)} KB
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFile(attachment.file_url, attachment.file_name);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-primary/10 p-4 bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-md shadow-lg">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 flex items-start gap-3 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border-l-4 border-primary shadow-sm">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Reply className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Répondre à {replyingTo.sender?.first_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {replyingTo.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {selectedFiles.map((file, index) => {
              const isImageFile = file.type.startsWith('image/');
              const preview = isImageFile ? URL.createObjectURL(file) : null;
              
              return (
                <div
                  key={index}
                  className="relative group"
                >
                  {isImageFile && preview ? (
                    <div className="relative">
                      <img 
                        src={preview} 
                        alt={file.name}
                        className="h-20 w-20 object-cover rounded-lg border border-border/50 shadow-sm"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center shadow-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-muted/80 px-3 py-2 rounded-xl text-sm shadow-sm border border-border/50">
                      {getFileIcon(file.type)}
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-end gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 h-11 w-11 rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/30 transition-all shadow-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Paperclip className="h-5 w-5 text-primary" />
          </Button>
          <div className="flex-1 bg-background border border-primary/20 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
            <Textarea
              ref={textareaRef}
              placeholder="Écrivez votre message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[48px] max-h-[120px] resize-none border-0 bg-transparent px-4 py-3.5 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              disabled={uploading}
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={(!messageText.trim() && selectedFiles.length === 0) || uploading}
            className="shrink-0 h-11 w-11 rounded-xl p-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg transition-all"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewerFile && (
        <FileViewerModal
          isOpen={!!viewerFile}
          onClose={() => setViewerFile(null)}
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
        />
      )}
    </div>
  );
};

export default ChatRoom;
