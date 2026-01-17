import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: { email: string; firstName: string; lastName: string }[];
}

const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  recipients
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error('Veuillez saisir un sujet');
      return;
    }

    if (!message.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    setLoading(true);
    try {
      // Get current user info for sender name
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user?.id)
        .single();

      const senderName = userData 
        ? `${userData.first_name} ${userData.last_name}` 
        : 'L\'équipe NECTFY';

      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          recipients: recipients.map(r => ({
            email: r.email,
            firstName: r.firstName,
            lastName: r.lastName
          })),
          subject,
          message,
          senderName
        }
      });

      if (error) throw error;

      toast.success(`Email envoyé à ${recipients.length} destinataire(s)`);
      setSubject('');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error sending bulk email:', error);
      toast.error('Erreur lors de l\'envoi des emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer un email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Envoyer un email à {recipients.length} destinataire(s)
          </div>

          <div className="max-h-24 overflow-y-auto space-y-1 bg-muted/50 rounded-lg p-3">
            {recipients.map((recipient, index) => (
              <div key={index} className="text-sm flex items-center justify-between">
                <span>{recipient.firstName} {recipient.lastName}</span>
                <span className="text-muted-foreground text-xs">{recipient.email}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sujet</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de l'email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              rows={6}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              'Envoi en cours...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailModal;
