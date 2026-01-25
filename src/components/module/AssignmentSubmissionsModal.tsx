import React, { useState, useEffect } from 'react';
import { X, User, Calendar, FileText, CheckCircle, Clock, Edit, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment, AssignmentSubmission } from '@/services/assignmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import CorrectionModal from './CorrectionModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignmentSubmissionsModalProps {
  assignment: Assignment;
  onClose: () => void;
}

const AssignmentSubmissionsModal: React.FC<AssignmentSubmissionsModalProps> = ({
  assignment,
  onClose
}) => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCorrectionModal, setShowCorrectionModal] = useState<AssignmentSubmission | null>(null);
  
  const { userId, userRole } = useCurrentUser();

  const isFormateur = userRole === 'Formateur';
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  // Correction accessible à tous les formateurs et admins, pas seulement au créateur
  const canCorrect = !!userId && (isFormateur || isAdmin);
  const canManage = canCorrect && assignment.created_by && assignment.created_by === userId;
  const canPublish = canCorrect;

  const fetchSubmissions = async () => {
    try {
      const data = await assignmentService.getAssignmentSubmissions(assignment.id);
      setSubmissions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des soumissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignment.id]);

  const handlePublishCorrections = async () => {
    if (confirm('Publier toutes les corrections corrigées ? Les étudiants pourront voir leurs notes.')) {
      try {
        await assignmentService.publishCorrections(assignment.id);
        fetchSubmissions();
      } catch (error) {
        console.error('Erreur lors de la publication:', error);
      }
    }
  };

  const handleCorrectionSuccess = () => {
    fetchSubmissions();
    setShowCorrectionModal(null);
  };

  const correctedCount = submissions.filter(s => s.correction?.is_corrected).length;
  const publishedCount = submissions.filter(s => s.correction?.published_at).length;

  const getStatusBadge = (submission: AssignmentSubmission) => {
    if (submission.correction?.published_at) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">
          <Award className="h-3 w-3 mr-1" />
          Publié ({submission.correction.score}/{submission.correction.max_score})
        </Badge>
      );
    }
    if (submission.correction?.is_corrected) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Corrigé ({submission.correction.score}/{submission.correction.max_score})
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
        <Clock className="h-3 w-3 mr-1" />
        Non corrigé
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-semibold">
                  {assignment.title}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {submissions.length} soumission{submissions.length > 1 ? 's' : ''}
                  </Badge>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-emerald-600">{correctedCount} corrigée{correctedCount > 1 ? 's' : ''}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-primary">{publishedCount} publiée{publishedCount > 1 ? 's' : ''}</span>
                </div>
              </div>
              {canPublish && correctedCount > 0 && correctedCount !== publishedCount && (
                <Button 
                  onClick={handlePublishCorrections}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/90"
                >
                  Publier les corrections
                </Button>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[calc(85vh-120px)]">
            <div className="p-6 pt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div 
                      key={submission.id} 
                      className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium">
                              {submission.student?.first_name?.[0]}{submission.student?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-foreground truncate">
                              {submission.student?.first_name} {submission.student?.last_name}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {submission.student?.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date(submission.submitted_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          
                          {getStatusBadge(submission)}
                          
                          {canCorrect && (
                            <Button 
                              size="sm"
                              variant={submission.correction?.is_corrected ? 'outline' : 'default'}
                              onClick={() => setShowCorrectionModal(submission)}
                              className={!submission.correction?.is_corrected ? 'bg-gradient-to-r from-primary to-primary/90' : ''}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              {submission.correction?.is_corrected ? 'Modifier' : 'Corriger'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {(submission.correction?.comments || submission.correction?.feedback) && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Commentaires</p>
                            <p className="text-sm text-foreground">{submission.correction.comments || submission.correction.feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Aucune soumission</h3>
                  <p className="text-muted-foreground">Aucun étudiant n'a encore rendu ce devoir.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {showCorrectionModal && (
        <CorrectionModal
          submission={showCorrectionModal}
          onClose={() => setShowCorrectionModal(null)}
          onSuccess={handleCorrectionSuccess}
        />
      )}
    </>
  );
};

export default AssignmentSubmissionsModal;
