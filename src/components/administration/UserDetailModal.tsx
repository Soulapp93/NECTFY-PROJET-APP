import React, { useEffect, useState } from 'react';
import { X, User, Mail, Phone, Building, Calendar, FileText, GraduationCap, Briefcase, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { User as UserType } from '@/services/userService';
import { useAllUserFormations } from '@/hooks/useAllUserFormations';
import { useUserTutors } from '@/hooks/useUserTutors';
import { useTutorStudents } from '@/hooks/useTutorStudents';
import { supabase } from '@/integrations/supabase/client';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

interface TutorInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name: string;
  position?: string;
  is_activated: boolean;
  profile_photo_url?: string;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user }) => {
  const { getUserFormations, refetch: refetchFormations } = useAllUserFormations(user?.id ? [user.id] : []);
  const { getUserTutors, refetch: refetchUserTutors } = useUserTutors();
  const { getTutorStudents, refetch: refetchTutorStudents } = useTutorStudents();
  const [tutorInfo, setTutorInfo] = useState<TutorInfo | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Rafraîchir toutes les données à l'ouverture de la modal
  useEffect(() => {
    const refreshAllData = async () => {
      if (isOpen && user) {
        // Rafraîchir les formations, tuteurs et étudiants
        await Promise.all([
          refetchFormations(),
          refetchUserTutors(),
          refetchTutorStudents()
        ]);
      }
    };

    refreshAllData();
  }, [isOpen, user?.id, refetchFormations, refetchUserTutors, refetchTutorStudents]);

  // Charger les infos du tuteur (vérifie via email dans la table tutors)
  useEffect(() => {
    const fetchTutorInfo = async () => {
      if (!user) {
        setTutorInfo(null);
        return;
      }

      try {
        setLoadingTutor(true);
        // Chercher si cet utilisateur est aussi un tuteur (par email)
        const { data, error } = await supabase
          .from('tutors')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();

        if (!error && data) {
          setTutorInfo(data);
        } else {
          setTutorInfo(null);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du tuteur:', err);
        setTutorInfo(null);
      } finally {
        setLoadingTutor(false);
      }
    };

    if (isOpen) {
      fetchTutorInfo();
    }
  }, [user, isOpen]);

  if (!user) return null;

  const userFormations = getUserFormations(user.id!);
  const userTutors = getUserTutors(user.id!);
  const tutorStudents = tutorInfo ? getTutorStudents(tutorInfo.id) : [];

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { bg: string; text: string }> = {
      'Admin': { bg: 'bg-primary/15', text: 'text-primary' },
      'AdminPrincipal': { bg: 'bg-primary/15', text: 'text-primary' },
      'Formateur': { bg: 'bg-info/15', text: 'text-info' },
      'Étudiant': { bg: 'bg-success/15', text: 'text-success' },
      'Tuteur': { bg: 'bg-warning/15', text: 'text-warning' }
    };

    const config = roleConfig[role] || { bg: 'bg-muted', text: 'text-muted-foreground' };

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

          {/* Avatar et infos principales */}
          <div className="relative flex items-center gap-4 mt-4">
            <div className="h-20 w-20 bg-white/20 rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center overflow-hidden">
              {user.profile_photo_url ? (
                <img 
                  src={user.profile_photo_url} 
                  alt={`Photo de profil de ${user.first_name} ${user.last_name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-white/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.first_name[0]}{user.last_name[0]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white">
                  {user.role}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  user.status === 'Actif' ? 'bg-green-500/30 text-green-100' :
                  user.status === 'En attente' ? 'bg-yellow-500/30 text-yellow-100' :
                  'bg-red-500/30 text-red-100'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="p-6 pt-4 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Informations personnelles */}
          <div className="bg-muted/30 rounded-xl p-5 border border-border">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              Informations personnelles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                  <p className="text-foreground font-medium break-all">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</label>
                  <p className="text-foreground font-medium">
                    {user.phone || <span className="text-muted-foreground italic">Non renseigné</span>}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date de création</label>
                  <p className="text-foreground font-medium">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ID Établissement</label>
                  <p className="text-foreground font-medium text-sm truncate max-w-[200px]">
                    {user.establishment_id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formations */}
          <div className="bg-muted/30 rounded-xl p-5 border border-border">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-info" />
              </div>
              Formations ({userFormations.length})
            </h3>
            {userFormations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {userFormations.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="bg-background rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: assignment.formation.color ? `${assignment.formation.color}20` : 'hsl(var(--primary) / 0.1)' }}
                      >
                        <FileText 
                          className="h-5 w-5" 
                          style={{ color: assignment.formation.color || 'hsl(var(--primary))' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{assignment.formation.title}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.formation.level}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Inscrit le {new Date(assignment.assigned_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucune formation assignée</p>
              </div>
            )}
          </div>

          {/* Tuteurs (pour les étudiants) */}
          {user.role === 'Étudiant' && (
            <div className="bg-muted/30 rounded-xl p-5 border border-border">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-warning" />
                </div>
                Tuteur(s) en entreprise ({userTutors.length})
              </h3>
              {userTutors.length > 0 ? (
                <div className="space-y-4">
                  {userTutors.map((tutor, index) => (
                    <div 
                      key={index} 
                      className="bg-background rounded-lg p-4 border border-border hover:border-warning/30 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="h-14 w-14 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-warning">
                            {tutor.tutor_first_name[0]}{tutor.tutor_last_name[0]}
                          </span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h4 className="font-semibold text-foreground text-lg">
                              {tutor.tutor_first_name} {tutor.tutor_last_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{tutor.tutor_email}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">{tutor.company_name}</span>
                            </div>
                            {tutor.position && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Briefcase className="h-4 w-4" />
                                <span>{tutor.position}</span>
                              </div>
                            )}
                          </div>
                          
                          {tutor.contract_type && (
                            <div className="pt-3 border-t border-border">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Type de contrat</span>
                                  <p className="text-foreground font-medium">{tutor.contract_type}</p>
                                </div>
                                {tutor.contract_start_date && (
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Début</span>
                                    <p className="text-foreground font-medium">
                                      {new Date(tutor.contract_start_date).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                )}
                                {tutor.contract_end_date && (
                                  <div className="bg-muted/50 rounded-lg p-3">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Fin</span>
                                    <p className="text-foreground font-medium">
                                      {new Date(tutor.contract_end_date).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Aucun tuteur assigné</p>
                </div>
              )}
            </div>
          )}

          {/* Étudiants (si c'est un tuteur dans la table tutors) */}
          {tutorInfo && (
            <div className="bg-muted/30 rounded-xl p-5 border border-border">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-success" />
                </div>
                Apprenti(s) ({tutorStudents.length})
              </h3>
              
              {/* Informations entreprise du tuteur */}
              {tutorInfo && (
                <div className="mb-4 p-4 bg-background rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="font-medium">{tutorInfo.company_name}</span>
                    </div>
                    {tutorInfo.position && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{tutorInfo.position}</span>
                      </div>
                    )}
                    {tutorInfo.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{tutorInfo.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {tutorStudents.length > 0 ? (
                <div className="space-y-3">
                  {tutorStudents.map((student, index) => (
                    <div 
                      key={index} 
                      className="bg-background rounded-lg p-4 border border-border hover:border-success/30 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-success">
                            {student.student_first_name?.[0]}{student.student_last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {student.student_first_name} {student.student_last_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{student.student_email}</span>
                            </div>
                          </div>
                          
                          {student.formation_title && (
                            <div className="flex items-center gap-2 text-sm">
                              <GraduationCap className="h-4 w-4 text-info" />
                              <span className="text-foreground">{student.formation_title}</span>
                              {student.formation_level && (
                                <span className="text-muted-foreground">({student.formation_level})</span>
                              )}
                            </div>
                          )}
                          
                          {student.contract_type && (
                            <div className="flex flex-wrap gap-3 pt-2">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                {student.contract_type}
                              </span>
                              {student.contract_start_date && (
                                <span className="text-xs text-muted-foreground">
                                  Du {new Date(student.contract_start_date).toLocaleDateString('fr-FR')}
                                  {student.contract_end_date && (
                                    <> au {new Date(student.contract_end_date).toLocaleDateString('fr-FR')}</>
                                  )}
                                </span>
                              )}
                              {student.is_active !== undefined && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  student.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                }`}>
                                  {student.is_active ? 'Actif' : 'Inactif'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Aucun apprenti assigné</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
