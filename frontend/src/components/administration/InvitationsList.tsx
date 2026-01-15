import { useState, useEffect } from 'react';
import { invitationService, Invitation } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Mail, RefreshCw, XCircle, Clock, CheckCircle, AlertCircle, UserPlus, Send } from 'lucide-react';
import InviteUserModal from './InviteUserModal';

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'Admin': 'Administrateur',
    'AdminPrincipal': 'Admin Principal',
    'Formateur': 'Formateur',
    'Étudiant': 'Étudiant',
  };
  return labels[role] || role;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'En attente', variant: 'secondary' as const, icon: Clock };
    case 'accepted':
      return { label: 'Acceptée', variant: 'default' as const, icon: CheckCircle };
    case 'expired':
      return { label: 'Expirée', variant: 'destructive' as const, icon: AlertCircle };
    case 'cancelled':
      return { label: 'Annulée', variant: 'outline' as const, icon: XCircle };
    default:
      return { label: status, variant: 'secondary' as const, icon: Clock };
  }
};

export default function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchInvitations = async () => {
    try {
      const data = await invitationService.getInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResend = async (invitation: Invitation) => {
    setActionLoading(invitation.id);
    try {
      const result = await invitationService.resendInvitation(invitation.id);
      if (result.success) {
        toast.success("Invitation renvoyée avec succès");
        fetchInvitations();
      } else {
        toast.error(result.error || "Erreur lors du renvoi de l'invitation");
      }
    } catch (error) {
      toast.error("Erreur lors du renvoi de l'invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (invitation: Invitation) => {
    setActionLoading(invitation.id);
    try {
      await invitationService.cancelInvitation(invitation.id);
      toast.success("Invitation annulée");
      fetchInvitations();
    } catch (error) {
      toast.error("Erreur lors de l'annulation de l'invitation");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Invitations</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les invitations envoyées aux utilisateurs
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter un utilisateur
        </Button>
      </div>

      {/* Invitations List */}
      {invitations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune invitation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Invitez des utilisateurs à rejoindre votre établissement
            </p>
            <Button onClick={() => setShowInviteModal(true)}>
              <Send className="mr-2 h-4 w-4" />
              Envoyer une invitation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => {
            const statusConfig = getStatusConfig(invitation.status);
            const StatusIcon = statusConfig.icon;
            const isActionLoading = actionLoading === invitation.id;

            return (
              <Card key={invitation.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{invitation.email}</p>
                          <Badge variant={statusConfig.variant} className="shrink-0">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {invitation.first_name && invitation.last_name && (
                            <span>{invitation.first_name} {invitation.last_name}</span>
                          )}
                          <span className="text-primary font-medium">{getRoleLabel(invitation.role)}</span>
                          <span>•</span>
                          <span>
                            Expire le {format(new Date(invitation.expires_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {invitation.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(invitation)}
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Renvoyer
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(invitation)}
                          disabled={isActionLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchInvitations}
      />
    </div>
  );
}
