import React, { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Trash2, Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleDocumentService, ModuleDocument } from '@/services/moduleDocumentService';
import CreateDocumentModal from './CreateDocumentModal';
import ModuleFileViewerModal from './ModuleFileViewerModal';
import { toast } from 'sonner';

interface ModuleDocumentsTabProps {
  moduleId: string;
}

const ModuleDocumentsTab: React.FC<ModuleDocumentsTabProps> = ({ moduleId }) => {
  const [documents, setDocuments] = useState<ModuleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<ModuleDocument | null>(null);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);

  const fetchDocuments = async () => {
    try {
      const data = await moduleDocumentService.getModuleDocuments(moduleId);
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [moduleId]);

  const handleCreateSuccess = () => {
    fetchDocuments();
    setShowCreateModal(false);
    toast.success('Document ajouté avec succès');
  };

  const handleEditSuccess = () => {
    fetchDocuments();
    setShowEditModal(null);
    toast.success('Document modifié avec succès');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await moduleDocumentService.deleteDocument(id);
        fetchDocuments();
        toast.success('Document supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenFile = (fileUrl: string, fileName: string) => {
    // Ouvrir le visualiseur intégré pour éviter les blocages Chrome
    setViewerFile({ url: fileUrl, name: fileName });
  };

  const handleDownloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleEdit = (document: ModuleDocument) => {
    setShowEditModal(document);
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'reference': return 'bg-purple-100 text-purple-800';
      case 'autre': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'xls':
      case 'xlsx':
        return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Documents</h2>
        <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {documents.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {documents.map((document) => (
            <div key={document.id} className="bg-card border border-primary/10 rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-primary/20 transition-all">
              <div className="flex flex-col gap-3">
                {/* Header avec titre et type */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{getFileIcon(document.file_name)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{document.title}</h3>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${getDocumentTypeColor(document.document_type)}`}>
                      {document.document_type}
                    </span>
                  </div>
                </div>
                
                {document.description && (
                  <p className="text-gray-600 text-xs sm:text-sm">{document.description}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center min-w-0">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{document.file_name}</span>
                  </div>
                  {document.file_size && (
                    <span className="flex-shrink-0">({formatFileSize(document.file_size)})</span>
                  )}
                </div>
                
                {/* Boutons d'action - responsive */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleOpenFile(document.file_url, document.file_name)}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span>Voir</span>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadDocument(document.file_url, document.file_name)}
                    className="flex-1 sm:flex-none text-xs sm:text-sm"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Télécharger</span>
                    <span className="sm:hidden">DL</span>
                  </Button>

                  <div className="flex items-center gap-1 ml-auto">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEdit(document)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600 h-8 w-8 p-0"
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 sm:py-12">
          <div className="inline-block p-6 rounded-2xl bg-muted/30 mb-4">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Aucun document</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Aucun document n'a encore été ajouté à ce module.</p>
        </div>
      )}

      {showCreateModal && (
        <CreateDocumentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          moduleId={moduleId}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && (
        <CreateDocumentModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          moduleId={moduleId}
          onSuccess={handleEditSuccess}
          editDocument={showEditModal}
        />
      )}

      {viewerFile && (
        <ModuleFileViewerModal
          isOpen={!!viewerFile}
          onClose={() => setViewerFile(null)}
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
        />
      )}
    </div>
  );
};

export default ModuleDocumentsTab;
