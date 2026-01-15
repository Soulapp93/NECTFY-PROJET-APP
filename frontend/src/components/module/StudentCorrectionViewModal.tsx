import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Download, Eye, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, AssignmentSubmission } from '@/services/assignmentService';
import ProductionFileViewer from '@/components/ui/viewers/ProductionFileViewer';
import { toast } from 'sonner';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {assignmentTitle || 'Correction du devoir'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/50 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Note - Mise en avant */}
          {hasCorrection && correction && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Votre note</h3>
                    <p className="text-sm text-gray-600">Correction publiée</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-green-700">
                    {correction.score}<span className="text-xl text-gray-500">/{correction.max_score}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {((correction.score || 0) / (correction.max_score || 100) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Commentaires du formateur */}
          {hasCorrection && correction?.comments && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Commentaires du formateur
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {correction.comments}
              </p>
            </div>
          )}

          {/* Pas encore de correction */}
          {!hasCorrection && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <Calendar className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-amber-900 mb-2">Correction en attente</h3>
              <p className="text-amber-700 text-sm">
                Votre devoir a été reçu et sera corrigé prochainement par le formateur.
              </p>
            </div>
          )}

          {/* Votre soumission */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                Votre soumission
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {submission.submission_text && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{submission.submission_text}</p>
                </div>
              )}

              {loading ? (
                <p className="text-gray-500 text-sm">Chargement des fichiers...</p>
              ) : submissionFiles.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Fichiers joints :</p>
                  {submissionFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-900 truncate">{file.file_name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.file_size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
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
                !submission.submission_text && (
                  <p className="text-gray-500 text-sm">Aucun contenu soumis.</p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Fermer
          </Button>
        </div>
      </div>

      {/* Document Viewer */}
      {viewerFile && (
        <ProductionFileViewer
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          isOpen={true}
          onClose={() => setViewerFile(null)}
        />
      )}
    </div>
  );
};

export default StudentCorrectionViewModal;
