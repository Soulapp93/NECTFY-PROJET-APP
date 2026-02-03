import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/services/assignmentService';
import { 
  FileText, 
  Calendar, 
  Award, 
  Download, 
  Clock,
  Paperclip,
  Eye
} from 'lucide-react';
import ProductionFileViewer from '@/components/ui/viewers/ProductionFileViewer';

interface AssignmentFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number | null;
  created_at?: string | null;
}

interface AssignmentDetailModalProps {
  assignment: Assignment;
  onClose: () => void;
}

const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = ({ assignment, onClose }) => {
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [viewingFile, setViewingFile] = useState<AssignmentFile | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data, error } = await (supabase
          .from('assignment_files') as any)
          .select('*')
          .eq('assignment_id', assignment.id);

        if (error) throw error;
        setFiles(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [assignment.id]);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} Mo`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} Ko`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['ppt', 'pptx'].includes(ext || '')) return '📽️';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['zip', 'rar', '7z'].includes(ext || '')) return '📦';
    return '📎';
  };

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();

  const handleDownload = async (file: AssignmentFile) => {
    try {
      window.open(file.file_url, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header fixe */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {assignment.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={assignment.is_published ? "default" : "secondary"}>
                    {assignment.is_published ? 'Publié' : 'Brouillon'}
                  </Badge>
                  {assignment.assignment_type && (
                    <Badge variant="outline">{assignment.assignment_type}</Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignment.due_date && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isOverdue ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50 border-border'
                }`}>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    isOverdue ? 'bg-destructive/20' : 'bg-primary/10'
                  }`}>
                    <Calendar className={`h-5 w-5 ${isOverdue ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date limite</p>
                    <p className={`font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                      {new Date(assignment.due_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                      {isOverdue && <span className="ml-2 text-sm">(Dépassée)</span>}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                  <Award className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Points maximum</p>
                  <p className="font-medium text-foreground">{assignment.max_points || 20} points</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {assignment.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Description
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {assignment.description}
                  </p>
                </div>
              </div>
            )}

            {/* Fichiers joints */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                Fichiers joints
                {files.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{files.length}</Badge>
                )}
              </h3>

              {loadingFiles ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Chargement des fichiers...
                </div>
              ) : files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{getFileIcon(file.file_name)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">
                            {file.file_name}
                          </p>
                          {file.file_size && (
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewingFile(file)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(file)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-lg bg-muted/20">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucun fichier joint à ce devoir
                </div>
              )}
            </div>

            {/* Dates de création */}
            {assignment.created_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
                <Clock className="h-3 w-3" />
                Créé le {new Date(assignment.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* Footer fixe */}
          <div className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
            <Button onClick={onClose} variant="outline" className="w-full">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de prévisualisation de fichier */}
      {viewingFile && (
        <ProductionFileViewer
          fileUrl={viewingFile.file_url}
          fileName={viewingFile.file_name}
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </>
  );
};

export default AssignmentDetailModal;
