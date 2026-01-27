import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Download, Eye, Calendar, User, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, AssignmentSubmission } from '@/services/assignmentService';
import ProductionFileViewer from '@/components/ui/viewers/ProductionFileViewer';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface StudentCorrectionViewModalProps {
  submission: AssignmentSubmission;
  assignmentTitle?: string;
  onClose: () => void;
}

const StudentCorrectionViewModal: React.FC<StudentCorrectionViewModalProps> = ({
  submission,
  assignmentTitle,
  onClose
}) => {
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await assignmentService.getSubmissionFiles(submission.id);
        setSubmissionFiles(files || []);
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, [submission.id]);

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
      toast.success('Fichier téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const correction = submission.correction;
  const hasCorrection = correction?.is_corrected && correction?.published_at;

  return (
    <>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          {/* En-tête */}
          <DialogHeader className="px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {assignmentTitle || 'Correction du devoir'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Section Note - Mise en avant */}
            {hasCorrection && correction && (
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Votre note</h3>
                        <p className="text-sm text-muted-foreground">Correction publiée</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-green-700">
                        {correction.score}<span className="text-xl text-muted-foreground">/{correction.max_score}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {((correction.score || 0) / (correction.max_score || 100) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commentaires du formateur */}
            {hasCorrection && (correction?.comments || correction?.feedback) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Commentaires du formateur
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {correction.comments || correction.feedback}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pas encore de correction */}
            {!hasCorrection && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-amber-900 mb-2">Correction en attente</h3>
                  <p className="text-amber-700 text-sm">
                    Votre devoir a été reçu et sera corrigé prochainement par le formateur.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Votre soumission */}
            <Card>
              <div className="bg-muted/30 px-5 py-3 border-b">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Votre soumission
                </h3>
              </div>
              <CardContent className="p-5 space-y-4">
                {(submission.submission_text || submission.content) && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-foreground whitespace-pre-wrap">{submission.submission_text || submission.content}</p>
                  </div>
                )}

                {loading ? (
                  <p className="text-muted-foreground text-sm">Chargement des fichiers...</p>
                ) : submissionFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Fichiers joints :</p>
                    {submissionFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-foreground truncate">{file.file_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.file_size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewerFile({ url: file.file_url, name: file.file_name })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadFile(file.file_url, file.file_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !(submission.submission_text || submission.content) && (
                    <p className="text-muted-foreground text-sm">Aucun contenu soumis.</p>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer fixe */}
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <Button onClick={onClose} className="w-full sm:w-auto">
              Fermer
            </Button>
          </DialogFooter>
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

export default StudentCorrectionViewModal;
