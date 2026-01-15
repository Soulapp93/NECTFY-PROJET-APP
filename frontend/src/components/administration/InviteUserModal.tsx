import { useState } from 'react';
import { z } from 'zod';
import { invitationService, CreateInvitationData } from '@/services/invitationService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Mail, User, Shield, Send, UserPlus } from 'lucide-react';

const emailSchema = z.string().email("Email invalide");

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const roleOptions = [
  { value: 'Admin', label: 'Administrateur', description: 'Gestion complète de l\'établissement', icon: Shield },
  { value: 'Formateur', label: 'Formateur', description: 'Gère les cours et les étudiants', icon: User },
  { value: 'Étudiant', label: 'Étudiant', description: 'Accès aux formations', icon: UserPlus },
];

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: '' as 'Admin' | 'Formateur' | 'Étudiant' | ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    try {
      emailSchema.parse(formData.email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (!formData.role) {
      toast.error("Veuillez sélectionner un rôle");
      return;
    }

    setLoading(true);

    try {
      const invitationData: CreateInvitationData = {
        email: formData.email.trim().toLowerCase(),
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
        role: formData.role
      };

      const result = await invitationService.sendInvitation(invitationData);

      if (result.success) {
        toast.success("Invitation envoyée avec succès !");
        setFormData({ email: '', first_name: '', last_name: '', role: '' });
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || "Erreur lors de l'envoi de l'invitation");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ email: '', first_name: '', last_name: '', role: '' });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            Inviter un utilisateur
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email. L'utilisateur recevra un lien pour créer son compte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="utilisateur@example.com"
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Jean"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Dupont"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rôle *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'Admin' | 'Formateur' | 'Étudiant' }))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>📧 Un email sera envoyé à l'adresse indiquée avec un lien d'invitation valable 48 heures.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
