import React, { useEffect, useState } from "react";
import { AlertCircle, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { assignmentService, Assignment } from '@/services/assignmentService';
import { fileUploadService } from '@/services/fileUploadService';
import { useCurrentUser, useUserWithRelations } from '@/hooks/useCurrentUser';
import FileUpload from '@/components/ui/file-upload';
import { toast } from 'sonner';

interface SubmitAssignmentModalProps {
  assignment: Assignment;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  assignment,
  onClose,
  onSuccess
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);

  const { userId, userRole } = useCurrentUser();
  const { userInfo, loading: userInfoLoading } = useUserWithRelations();

  // Vérifier si l'utilisateur est bien un étudiant
  const isStudent = userRole === 'Étudiant';

  useEffect(() => {
    // Vérifier si l'étudiant a déjà soumis ce devoir
    const checkExistingSubmission = async () => {
      if (!userId) return;
      
      try {
        const submissions = await assignmentService.getAssignmentSubmissions(assignment.id);
        const mySubmission = submissions.find(s => s.student_id === userId);
        if (mySubmission) {
          setHasExistingSubmission(true);
        }
      } catch (error) {
        console.error('Erreur vérification soumission:', error);
      }
    };

    checkExistingSubmission();
  }, [assignment.id, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('Vous devez être connecté pour rendre un devoir');
      return;
    }

    if (!isStudent) {
      toast.error('Seuls les étudiants peuvent rendre des devoirs');
      return;
    }
    
    if (!submissionText.trim() && selectedFiles.length === 0) {
      toast.error('Veuillez ajouter du texte ou des fichiers pour votre soumission');
      return;
    }

    setLoading(true);

    try {
      // Créer la soumission avec l'ID utilisateur authentifié
      const submission = await assignmentService.submitAssignment({
        assignment_id: assignment.id,
        student_id: userId,
        content: submissionText.trim() || null
      });

      // Uploader les fichiers si il y en a
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            const fileUrl = await fileUploadService.uploadFile(file);
            await assignmentService.addSubmissionFile({
              submission_id: submission.id,
              file_url: fileUrl,
              file_name: file.name,
              file_size: file.size
            });
          } catch (fileError) {
            console.error('Erreur upload fichier:', fileError);
            toast.error(`Erreur lors de l'upload de ${file.name}`);
          }
        }
      }

      toast.success('Devoir rendu avec succès!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Vous avez déjà rendu ce devoir');
      } else {
        toast.error('Erreur lors de la soumission du devoir');
      }
    } finally {
      setLoading(false);
    }
  };

  if (userInfoLoading) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chargement…</DialogTitle>
            <DialogDescription>Veuillez patienter.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isStudent) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Accès non autorisé
            </DialogTitle>
            <DialogDescription>
              Seuls les étudiants peuvent rendre des devoirs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (hasExistingSubmission) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Devoir déjà rendu
            </DialogTitle>
            <DialogDescription>
              Vous avez déjà soumis ce devoir. Une seule soumission est autorisée par étudiant.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 py-5 border-b">
          <DialogHeader className="space-y-1">
            <DialogTitle>Rendre le devoir</DialogTitle>
            <DialogDescription className="line-clamp-2">{assignment.title}</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Informations de l'étudiant */}
            {userInfo && (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Soumission par :</p>
                <p className="font-medium text-foreground">
                  {userInfo.first_name} {userInfo.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{userInfo.email}</p>
              </Card>
            )}

            {/* Détails du devoir */}
            {assignment.description && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-foreground">Description du devoir</h3>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {assignment.description}
                </p>
                {assignment.due_date && (
                  <p className="text-sm text-muted-foreground mt-3">
                    À rendre avant le : {new Date(assignment.due_date).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </Card>
            )}

            <div className="space-y-2">
              <Label>Votre réponse</Label>
              <Textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Rédigez votre réponse ici..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Fichiers joints</Label>
              <FileUpload
                onFileSelect={setSelectedFiles}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx"
                maxSize={10}
              />
              <p className="text-xs text-muted-foreground">
                Formats acceptés : PDF, Word, Images, Archives (max 10MB par fichier)
              </p>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Envoi en cours...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Rendre le devoir
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitAssignmentModal;
