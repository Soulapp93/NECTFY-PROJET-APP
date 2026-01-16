import React from 'react';
import { X, User, Mail, Phone, Building, Calendar, GraduationCap, Briefcase, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tutor } from '@/services/tutorService';
import { useTutorStudents, TutorStudent } from '@/hooks/useTutorStudents';

interface TutorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor | null;
}

const TutorDetailModal: React.FC<TutorDetailModalProps> = ({ isOpen, onClose, tutor }) => {
  const { getTutorStudents } = useTutorStudents();

  if (!tutor) return null;

  const tutorStudents = getTutorStudents(tutor.id);

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
            <div className="h-16 w-16 bg-white/20 rounded-2xl border-2 border-white/30 shadow-lg flex items-center justify-center overflow-hidden">
              {tutor.profile_photo_url ? (
                <img 
                  src={tutor.profile_photo_url} 
                  alt={`Photo de profil de ${tutor.first_name} ${tutor.last_name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-white/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {tutor.first_name[0]}{tutor.last_name[0]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {tutor.first_name} {tutor.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white">
                  Tuteur
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${tutor.is_activated ? 'bg-success/30 text-white' : 'bg-white/20 text-white'}`}>
                  {tutor.is_activated ? 'Actif' : 'Inactif'}
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
                  <p className="text-foreground font-medium">{tutor.email}</p>
                </div>
              </div>
              {tutor.phone && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Téléphone</label>
                    <p className="text-foreground font-medium">{tutor.phone}</p>
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
                    {new Date(tutor.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations entreprise */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-4 w-4 text-primary" />
              </div>
              Entreprise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nom de l'entreprise</label>
                  <p className="text-foreground font-medium">{tutor.company_name}</p>
                </div>
              </div>
              {tutor.position && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Poste</label>
                    <p className="text-foreground font-medium">{tutor.position}</p>
                  </div>
                </div>
              )}
              {tutor.company_address && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Adresse</label>
                    <p className="text-foreground font-medium">{tutor.company_address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Apprentis */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              Apprentis {tutorStudents.length > 0 && `(${tutorStudents.length})`}
            </h3>
            {tutorStudents.length > 0 ? (
              <div className="space-y-3">
                {tutorStudents.map((student, index) => (
                  <div 
                    key={index} 
                    className="bg-background rounded-lg p-4 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {student.student_first_name} {student.student_last_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{student.student_email}</span>
                        </div>
                      </div>
                      {student.is_active !== undefined && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${student.is_active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {student.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      )}
                    </div>
                    
                    {student.formation_title && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-medium text-foreground">{student.formation_title}</span>
                          {student.formation_level && (
                            <span className="text-xs text-muted-foreground">({student.formation_level})</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {student.contract_type && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type de contrat</span>
                            <p className="text-foreground font-medium">{student.contract_type}</p>
                          </div>
                          {student.contract_start_date && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Début</span>
                              <p className="text-foreground font-medium">
                                {new Date(student.contract_start_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                          {student.contract_end_date && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fin</span>
                              <p className="text-foreground font-medium">
                                {new Date(student.contract_end_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucun apprenti assigné</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorDetailModal;
