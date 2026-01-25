import React, { useState, useEffect } from 'react';
import { X, Download, File, Eye, Award, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, AssignmentSubmission } from '@/services/assignmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ProductionFileViewer from '@/components/ui/viewers/ProductionFileViewer';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CorrectionModalProps {
  submission: AssignmentSubmission;
  onClose: () => void;
  onSuccess: () => void;
}

const CorrectionModal: React.FC<CorrectionModalProps> = ({
  submission,
  onClose,
  onSuccess
}) => {
  const [correction, setCorrection] = useState({
    score: 0,
    max_score: 100,
    comments: ''
  });
  const [loading, setLoading] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);
  const { userId, userRole, loading: userLoading } = useCurrentUser();

  // Vérifier que seul un formateur peut corriger
  const isFormateur = userRole === 'Formateur' || userRole === 'Admin' || userRole === 'AdminPrincipal';

  useEffect(() => {
    // Charger les fichiers de la soumission
    const loadSubmissionFiles = async () => {
      try {
        const files = await assignmentService.getSubmissionFiles(submission.id);
        setSubmissionFiles(files || []);
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
      }
    };

    loadSubmissionFiles();

    // Si une correction existe déjà, la charger
    if (submission.correction) {
      setCorrection({
        score: submission.correction.score || 0,
        max_score: submission.correction.max_score || 100,
        comments: submission.correction.comments || submission.correction.feedback || ''
      });
    }
  }, [submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('Utilisateur non authentifié');
      return;
    }

    if (!isFormateur) {
      toast.error('Seuls les formateurs peuvent corriger les devoirs');
      return;
    }

    setLoading(true);

    try {
      await assignmentService.correctSubmission(submission.id, {
        grade: correction.score,
        feedback: correction.comments,
        corrector_id: userId
      });

      toast.success('Correction sauvegardée avec succès');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la correction:', error);
      toast.error('Erreur lors de la sauvegarde de la correction');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
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
      
      toast.success('Fichier téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  const viewFile = (fileUrl: string, fileName: string) => {
    setViewerFile({ url: fileUrl, name: fileName });
  };

  const percentage = correction.max_score > 0 ? (correction.score / correction.max_score) * 100 : 0;
  const getGradeColor = () => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <>
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-semibold text-lg">
                  {submission.student?.first_name?.[0]}{submission.student?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Correction - {submission.student?.first_name} {submission.student?.last_name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Évaluez et notez la soumission de l'étudiant
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Soumission de l'étudiant */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Soumission de l'étudiant</h3>
                  </div>
                  
                  {(submission.submission_text || submission.content) && (
                    <div className="bg-muted/30 rounded-xl p-4 border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Réponse textuelle</p>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                        {submission.submission_text || submission.content}
                      </p>
                    </div>
                  )}

                  {submissionFiles.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Fichiers joints ({submissionFiles.length})</p>
                      {submissionFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                              <File className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">
                                {file.file_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(file.file_size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewFile(file.file_url, file.file_name)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Prévisualiser
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => downloadFile(file.file_url, file.file_name)}
                              className="flex-1 bg-primary hover:bg-primary/90"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')} à {new Date(submission.submitted_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Badge>
                </div>

                {/* Formulaire de correction */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Correction</h3>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="score" className="text-sm font-medium text-foreground">
                          Note obtenue
                        </Label>
                        <Input
                          id="score"
                          type="number"
                          min="0"
                          max={correction.max_score}
                          value={correction.score}
                          onChange={(e) => setCorrection({ ...correction, score: parseInt(e.target.value) || 0 })}
                          className="text-lg font-semibold h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_score" className="text-sm font-medium text-foreground">
                          Note maximale
                        </Label>
                        <Input
                          id="max_score"
                          type="number"
                          min="1"
                          value={correction.max_score}
                          onChange={(e) => setCorrection({ ...correction, max_score: parseInt(e.target.value) || 100 })}
                          className="text-lg font-semibold h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comments" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Commentaires de correction
                      </Label>
                      <Textarea
                        id="comments"
                        value={correction.comments}
                        onChange={(e) => setCorrection({ ...correction, comments: e.target.value })}
                        rows={6}
                        placeholder="Ajoutez vos commentaires détaillés de correction..."
                        className="resize-none"
                      />
                    </div>

                    {/* Résumé de la note */}
                    <div className={`rounded-xl p-4 border-2 ${getGradeColor()} transition-colors`}>
                      <div className="flex items-center justify-center gap-3">
                        <Star className="h-6 w-6" />
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {correction.score}/{correction.max_score}
                          </p>
                          <p className="text-sm font-medium opacity-80">
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg"
                      >
                        {loading ? 'Sauvegarde...' : 'Sauvegarder la correction'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      {viewerFile && (
        <ProductionFileViewer
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          isOpen={true}
          onClose={() => setViewerFile(null)}
        />
      )}
    </>
  );
};

export default CorrectionModal;
