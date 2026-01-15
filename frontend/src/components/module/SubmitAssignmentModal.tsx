import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        submission_text: submissionText.trim() || null
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="font-semibold">Accès non autorisé</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Seuls les étudiants peuvent rendre des devoirs.
          </p>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </div>
    );
  }

  if (hasExistingSubmission) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="font-semibold">Devoir déjà rendu</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Vous avez déjà soumis ce devoir. Une seule soumission est autorisée par étudiant.
          </p>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Rendre le devoir</h2>
            <p className="text-sm text-gray-600">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Informations de l'étudiant */}
          {userInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Soumission par :</p>
              <p className="font-medium text-gray-900">
                {userInfo.first_name} {userInfo.last_name}
              </p>
              <p className="text-sm text-gray-500">{userInfo.email}</p>
            </div>
          )}

          {/* Détails du devoir */}
          {assignment.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Description du devoir
              </h3>
              <p className="text-blue-800 text-sm">{assignment.description}</p>
              {assignment.due_date && (
                <p className="text-sm text-blue-600 mt-3 font-medium">
                  📅 À rendre avant le: {new Date(assignment.due_date).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre réponse
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Rédigez votre réponse ici..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichiers joints
              </label>
              <FileUpload
                onFileSelect={setSelectedFiles}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar,.pptx,.xlsx"
                maxSize={10}
              />
              <p className="text-xs text-gray-500 mt-2">
                Formats acceptés: PDF, Word, Images, Archives (max 10MB par fichier)
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignmentModal;
