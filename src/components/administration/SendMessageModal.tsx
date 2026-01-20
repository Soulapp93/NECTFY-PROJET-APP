import React, { useState } from 'react';
import { Mail, Send, MessageSquare, ExternalLink, Paperclip, X, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { messageService } from '@/services/messageService';
import { fileUploadService } from '@/services/fileUploadService';
import { DateTimePicker } from '@/components/ui/datetime-picker';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: { id: string; email: string; firstName: string; lastName: string }[];
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  recipients
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'nectfy' | 'gmail'>('nectfy');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setAttachments([]);
    setScheduleEnabled(false);
    setScheduledDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSendViaGmail = () => {
    const emails = recipients.map(r => r.email).join(',');
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(emails)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(gmailUrl, '_blank');
    toast.success('Gmail ouvert dans un nouvel onglet');
  };

  const handleSendViaNectfy = async () => {
    if (!subject.trim()) {
      toast.error('Veuillez saisir un sujet');
      return;
    }

    if (!message.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    if (scheduleEnabled && !scheduledDate) {
      toast.error('Veuillez sélectionner une date pour la programmation');
      return;
    }

    setLoading(true);
    try {
      // Upload attachments if any
      const uploadedFiles: { file_name: string; file_url: string; file_size: number }[] = [];
      for (const file of attachments) {
        const fileUrl = await fileUploadService.uploadFile(file, 'message-attachments');
        uploadedFiles.push({
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size
        });
      }

      // Create message via NECTFY messaging system
      await messageService.createMessage({
        subject,
        content: message,
        recipients: {
          type: 'user',
          ids: recipients.map(r => r.id)
        },
        attachments: uploadedFiles,
        scheduledFor: scheduleEnabled ? scheduledDate : undefined
      });

      toast.success(
        scheduleEnabled 
          ? `Message programmé pour ${recipients.length} destinataire(s)` 
          : `Message envoyé à ${recipients.length} destinataire(s)`
      );
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer un message
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'nectfy' | 'gmail')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nectfy" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Via NECTFY
            </TabsTrigger>
            <TabsTrigger value="gmail" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Via Gmail
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="text-sm text-muted-foreground">
              {recipients.length} destinataire(s) sélectionné(s)
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 bg-muted/50 rounded-lg p-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="text-sm flex items-center justify-between">
                  <span className="font-medium">{recipient.firstName} {recipient.lastName}</span>
                  <span className="text-muted-foreground text-xs">{recipient.email}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet du message"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message..."
                rows={4}
              />
            </div>

            {/* Schedule option - Only for NECTFY */}
            {activeTab === 'nectfy' && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="schedule"
                    checked={scheduleEnabled}
                    onCheckedChange={(checked) => setScheduleEnabled(checked === true)}
                  />
                  <Label htmlFor="schedule" className="flex items-center gap-2 cursor-pointer">
                    <Calendar className="h-4 w-4" />
                    Programmer l'envoi
                  </Label>
                </div>

                {scheduleEnabled && (
                  <div className="flex items-center gap-2 pl-6">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <DateTimePicker
                      value={scheduledDate}
                      onChange={(value) => setScheduledDate(value)}
                      placeholder="Sélectionner date et heure"
                      className="max-w-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Attachments - Only for NECTFY */}
            {activeTab === 'nectfy' && (
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  Pièces jointes
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload-admin')?.click()}
                  >
                    <Paperclip className="h-4 w-4 mr-2" />
                    Ajouter des fichiers
                  </Button>
                  <input
                    id="file-upload-admin"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} Ko)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <TabsContent value="nectfy" className="mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Message NECTFY :</strong> Les destinataires recevront le message dans leur espace messagerie NECTFY 
                et une notification email les informant qu'ils ont reçu un message.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Annuler
              </Button>
              <Button onClick={handleSendViaNectfy} disabled={loading}>
                {loading ? (
                  'Envoi en cours...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {scheduleEnabled ? 'Programmer' : 'Envoyer via NECTFY'}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="gmail" className="mt-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Gmail :</strong> Gmail s'ouvrira dans un nouvel onglet avec les destinataires, 
                le sujet et le message pré-remplis. Vous pourrez modifier et envoyer depuis Gmail.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleSendViaGmail} variant="success">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir Gmail
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageModal;
