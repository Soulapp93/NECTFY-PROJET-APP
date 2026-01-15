import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Paperclip, Upload, X, Search, Users, User, Send, 
  FileText, Clock, Save, Mail, Image, Film, File,
  Calendar
} from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';
import { useUsers } from '@/hooks/useUsers';
import { useMessages } from '@/hooks/useMessages';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DateTimePicker } from '@/components/ui/datetime-picker';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    messageId: string;
    subject: string;
    senderName: string;
    senderId: string;
    originalContent: string;
  };
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return <Image className="h-4 w-4 text-green-500" />;
  }
  if (['mp4', 'webm', 'avi', 'mov'].includes(ext || '')) {
    return <Film className="h-4 w-4 text-purple-500" />;
  }
  if (['pdf'].includes(ext || '')) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-muted-foreground" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const NewMessageModal = ({ isOpen, onClose, replyTo }: NewMessageModalProps) => {
  const [activeTab, setActiveTab] = useState('individual');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isReplyMode, setIsReplyMode] = useState(false);
  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [allInstructors, setAllInstructors] = useState(false);
  const [allFormations, setAllFormations] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const { formations } = useFormations();
  const { users } = useUsers();
  const { sendMessage } = useMessages();

  // Initialize reply mode when replyTo changes
  useEffect(() => {
    if (replyTo && isOpen) {
      setIsReplyMode(true);
      setActiveTab('individual');
      setSubject(replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`);
      setRecipient(replyTo.senderName);
      setSearchTerm(replyTo.senderName);
      setMessage(`\n\n---\nMessage original de ${replyTo.senderName}:\n${replyTo.originalContent}`);
      const sender = users.find(u => u.id === replyTo.senderId);
      if (sender) {
        setFilteredUsers([sender]);
      }
    }
  }, [replyTo, isOpen, users]);

  // Filter users based on search term for individual messages
  useEffect(() => {
    if (activeTab === 'individual' && searchTerm && !isReplyMode) {
      const filtered = users.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered.slice(0, 5));
      setShowUserDropdown(filtered.length > 0);
    } else if (!isReplyMode) {
      setFilteredUsers([]);
      setShowUserDropdown(false);
    }
  }, [searchTerm, users, activeTab, isReplyMode]);

  const instructors = users.filter(user => user.role === 'Formateur');

  const resetForm = () => {
    setRecipient('');
    setSubject('');
    setMessage('');
    setScheduleDelivery(false);
    setScheduledDate('');
    setAttachments([]);
    setSelectedFormations([]);
    setSelectedInstructors([]);
    setAllInstructors(false);
    setAllFormations(false);
    setSearchTerm('');
    setSending(false);
    setIsReplyMode(false);
    setShowUserDropdown(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSend = async (isDraft = false) => {
    if (!subject || !message) {
      toast.error('Veuillez remplir l\'objet et le message');
      return;
    }

    if (scheduleDelivery && !scheduledDate) {
      toast.error('Veuillez sélectionner une date et heure pour la programmation');
      return;
    }

    try {
      setSending(true);
      
      let recipients: { type: 'user' | 'formation' | 'all_instructors'; ids?: string[] } = { type: 'user' };

      if (activeTab === 'individual') {
        if (isReplyMode && replyTo) {
          recipients = { type: 'user', ids: [replyTo.senderId] };
        } else {
          const selectedUser = filteredUsers.find(user => 
            `${user.first_name} ${user.last_name}` === recipient || user.email === recipient
          );
          if (!selectedUser) {
            toast.error('Veuillez sélectionner un destinataire valide');
            return;
          }
          recipients = { type: 'user', ids: [selectedUser.id] };
        }
      } else if (activeTab === 'groups') {
        if (!allFormations && selectedFormations.length === 0) {
          toast.error('Veuillez sélectionner au moins une formation');
          return;
        }
        if (allFormations) {
          recipients = { type: 'formation', ids: formations.map(f => f.id) };
        } else {
          recipients = { type: 'formation', ids: selectedFormations };
        }
      } else if (activeTab === 'instructors') {
        if (allInstructors) {
          recipients = { type: 'all_instructors' };
        } else if (selectedInstructors.length === 0) {
          toast.error('Veuillez sélectionner au moins un formateur');
          return;
        } else {
          recipients = { type: 'user', ids: selectedInstructors };
        }
      }

      await sendMessage({
        subject,
        content: message,
        scheduled_for: scheduleDelivery && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        is_draft: isDraft,
        recipients,
        attachments
      });

      toast.success(isDraft ? 'Brouillon enregistré' : 'Message envoyé avec succès');
      handleClose();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = () => {
    handleSend(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUserSelect = (user: any) => {
    setRecipient(`${user.first_name} ${user.last_name}`);
    setSearchTerm(`${user.first_name} ${user.last_name}`);
    setFilteredUsers([user]);
    setShowUserDropdown(false);
  };

  const handleFormationToggle = (formationId: string) => {
    setSelectedFormations(prev => 
      prev.includes(formationId) 
        ? prev.filter(id => id !== formationId)
        : [...prev, formationId]
    );
  };

  const handleInstructorToggle = (instructorId: string) => {
    setSelectedInstructors(prev => 
      prev.includes(instructorId) 
        ? prev.filter(id => id !== instructorId)
        : [...prev, instructorId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-0">
        {/* Header modernisé */}
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">{isReplyMode ? `Répondre à ${replyTo?.senderName}` : 'Nouveau message'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-6">
          {/* Tabs modernisés */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-12 p-1 bg-muted/50">
              <TabsTrigger 
                value="individual" 
                className="flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Individuel</span>
              </TabsTrigger>
              <TabsTrigger 
                value="groups" 
                className="flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Formations</span>
              </TabsTrigger>
              <TabsTrigger 
                value="instructors" 
                className="flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Formateurs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="mt-4">
              <div className="relative">
                <Label htmlFor="recipient" className="text-sm font-medium mb-2 block">
                  Destinataire
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recipient"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm && setShowUserDropdown(true)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-primary/50"
                  />
                </div>
                
                {showUserDropdown && filteredUsers.length > 0 && (
                  <Card className="absolute z-10 w-full mt-2 overflow-hidden shadow-lg border-border/50">
                    {filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full px-4 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors border-b border-border/30 last:border-0"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profile_photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {user.first_name[0]}{user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </button>
                    ))}
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <Checkbox
                    id="all-formations"
                    checked={allFormations}
                    onCheckedChange={(checked) => {
                      setAllFormations(checked as boolean);
                      if (checked) setSelectedFormations([]);
                    }}
                  />
                  <Label htmlFor="all-formations" className="font-medium cursor-pointer flex-1">
                    Toutes les formations
                  </Label>
                </div>
                
                {!allFormations && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                    {formations.map(formation => (
                      <div 
                        key={formation.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                          selectedFormations.includes(formation.id)
                            ? "bg-primary/10 border-primary/50"
                            : "bg-muted/20 border-border/50 hover:bg-muted/40"
                        )}
                        onClick={() => handleFormationToggle(formation.id)}
                      >
                        <Checkbox
                          id={`formation-${formation.id}`}
                          checked={selectedFormations.includes(formation.id)}
                          onCheckedChange={() => handleFormationToggle(formation.id)}
                        />
                        <Label 
                          htmlFor={`formation-${formation.id}`} 
                          className="text-sm cursor-pointer flex-1 truncate"
                        >
                          {formation.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="instructors" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <Checkbox
                    id="all-instructors"
                    checked={allInstructors}
                    onCheckedChange={(checked) => {
                      setAllInstructors(checked as boolean);
                      if (checked) setSelectedInstructors([]);
                    }}
                  />
                  <Label htmlFor="all-instructors" className="font-medium cursor-pointer flex-1">
                    Tous les formateurs
                  </Label>
                </div>
                
                {!allInstructors && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {instructors.map(instructor => (
                      <div 
                        key={instructor.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                          selectedInstructors.includes(instructor.id)
                            ? "bg-primary/10 border-primary/50"
                            : "bg-muted/20 border-border/50 hover:bg-muted/40"
                        )}
                        onClick={() => handleInstructorToggle(instructor.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={instructor.profile_photo_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {instructor.first_name[0]}{instructor.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1">{instructor.first_name} {instructor.last_name}</span>
                        <Checkbox
                          checked={selectedInstructors.includes(instructor.id)}
                          onCheckedChange={() => handleInstructorToggle(instructor.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Objet */}
          <div>
            <Label htmlFor="subject" className="text-sm font-medium mb-2 block">
              Objet
            </Label>
            <Input
              id="subject"
              placeholder="Sujet du message..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-muted/30 border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium mb-2 block">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Rédigez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[200px] resize-y text-base leading-relaxed bg-muted/30 border-border/50 focus:border-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {message.length} caractères
            </p>
          </div>

          {/* Programmation */}
          <Card className={cn(
            "p-4 border transition-all",
            scheduleDelivery ? "border-primary/50 bg-primary/5" : "border-border/50 bg-muted/20"
          )}>
            <div className="flex items-center gap-3">
              <Checkbox
                id="schedule"
                checked={scheduleDelivery}
                onCheckedChange={(checked) => {
                  setScheduleDelivery(checked as boolean);
                  if (!checked) setScheduledDate('');
                }}
              />
              <Label htmlFor="schedule" className="font-medium cursor-pointer flex items-center gap-2 flex-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Programmer l'envoi
              </Label>
            </div>

            {scheduleDelivery && (
              <div className="mt-4 pl-7">
                <DateTimePicker
                  value={scheduledDate}
                  onChange={(value) => setScheduledDate(value)}
                  placeholder="Sélectionner date et heure"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Le message sera envoyé automatiquement à la date sélectionnée
                </p>
              </div>
            )}
          </Card>

          {/* Pièces jointes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                Pièces jointes
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Ajouter
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {attachments.length > 0 && (
              <div className="grid gap-2">
                {attachments.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(file.name)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer avec actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-6 pt-4 border-t border-border/50 bg-muted/30">
          <Button variant="ghost" onClick={handleClose} disabled={sending} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveDraft} 
            disabled={sending}
            className="w-full sm:w-auto gap-2"
          >
            <Save className="h-4 w-4" />
            Brouillon
          </Button>
          <Button 
            onClick={() => handleSend(false)} 
            disabled={sending}
            className="w-full sm:w-auto gap-2 shadow-lg"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageModal;
