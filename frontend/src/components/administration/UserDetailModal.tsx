import React from 'react';
import { X, User, Mail, Phone, Building, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User as UserType } from '@/services/userService';
import { useUserFormations } from '@/hooks/useUserFormations';
import { useUserTutors } from '@/hooks/useUserTutors';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user }) => {
  const { getUserFormations } = useUserFormations();
  const { getUserTutors } = useUserTutors();

  if (!user) return null;

  const userFormations = getUserFormations(user.id!);
  const userTutors = getUserTutors(user.id!);

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { bg: string; text: string }> = {
      'Admin': { bg: 'bg-primary/15', text: 'text-primary' },
      'AdminPrincipal': { bg: 'bg-primary/15', text: 'text-primary' },
      'Formateur': { bg: 'bg-info/15', text: 'text-info' },
      'Étudiant': { bg: 'bg-muted', text: 'text-muted-foreground' }
    };

    const config = roleConfig[role] || roleConfig['Étudiant'];

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      'Actif': { bg: 'bg-success/15', text: 'text-success' },
      'Inactif': { bg: 'bg-destructive/15', text: 'text-destructive' },
      'En attente': { bg: 'bg-warning/15', text: 'text-warning' }
    };

    const config = statusConfig[status] || { bg: 'bg-muted', text: 'text-muted-foreground' };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-2 border-primary/20 rounded-2xl">
        {/* En-tête avec gradient violet */}
        <div className="relative bg-gradient-to-r from-primary to-accent p-6 pb-6">
          {/* Bouton fermer */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Motif décoratif */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
          </div>

          {/* Avatar et infos principales - entièrement sur le violet */}
          <div className="relative flex items-center gap-4 mt-4">
            <div className="h-16 w-16 bg-white/20 rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center overflow-hidden">
              {user.profile_photo_url ? (
                <img 
                  src={user.profile_photo_url} 
                  alt={`Photo de profil de ${user.first_name} ${user.last_name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-white/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {user.first_name[0]}{user.last_name[0]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white">
                  {user.role}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white">
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="p-6 pt-4 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Informations personnelles */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                  <p className="text-foreground font-medium">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</label>
                    <p className="text-foreground font-medium">{user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date de création</label>
                  <p className="text-foreground font-medium">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formations */}
          {userFormations.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                Formations ({userFormations.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userFormations.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="bg-background rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                  >
                    <h4 className="font-semibold text-foreground">{assignment.formation.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{assignment.formation.level}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Inscrit le {new Date(assignment.assigned_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tuteurs (pour les étudiants) */}
          {user.role === 'Étudiant' && userTutors.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                Tuteurs en entreprise ({userTutors.length})
              </h3>
              <div className="space-y-3">
                {userTutors.map((tutor, index) => (
                  <div 
                    key={index} 
                    className="bg-background rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {tutor.tutor_first_name} {tutor.tutor_last_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{tutor.tutor_email}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Building className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium text-foreground">{tutor.company_name}</span>
                        </div>
                        {tutor.position && (
                          <p className="text-sm text-muted-foreground">{tutor.position}</p>
                        )}
                      </div>
                    </div>
                    {tutor.contract_type && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type de contrat</span>
                            <p className="text-foreground font-medium">{tutor.contract_type}</p>
                          </div>
                          {tutor.contract_start_date && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Début</span>
                              <p className="text-foreground font-medium">
                                {new Date(tutor.contract_start_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                          {tutor.contract_end_date && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin</span>
                              <p className="text-foreground font-medium">
                                {new Date(tutor.contract_end_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
