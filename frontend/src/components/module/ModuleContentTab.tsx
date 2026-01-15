import React, { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Edit, Trash2, Download, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleContentService, ModuleContent } from '@/services/moduleContentService';
import CreateContentModal from './CreateContentModal';
import ModuleFileViewerModal from './ModuleFileViewerModal';
import LinkViewerModal from './LinkViewerModal';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ModuleContentTabProps {
  moduleId: string;
}

const ModuleContentTab: React.FC<ModuleContentTabProps> = ({ moduleId }) => {
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<ModuleContent | null>(null);
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string } | null>(null);
  const [viewerLink, setViewerLink] = useState<{ url: string; title: string } | null>(null);
  const { userRole } = useCurrentUser();
  
  // Les tuteurs ne peuvent que consulter (pas d'édition/suppression/ajout)
  const canEdit = userRole !== 'Tuteur' && userRole !== 'Étudiant';

  const fetchContents = async () => {
    try {
      const data = await moduleContentService.getModuleContents(moduleId);
      setContents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement du contenu:', error);
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [moduleId]);

  const handleCreateSuccess = () => {
    fetchContents();
    setShowCreateModal(false);
    toast.success('Contenu ajouté avec succès');
  };

  const handleEditSuccess = () => {
    fetchContents();
    setShowEditModal(null);
    toast.success('Contenu modifié avec succès');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      try {
        await moduleContentService.deleteContent(id);
        fetchContents();
        toast.success('Contenu supprimé avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleOpenFile = (fileUrl: string, fileName: string) => {
    setViewerFile({ url: fileUrl, name: fileName });
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
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

  const handleEdit = (content: ModuleContent) => {
    setShowEditModal(content);
  };

  const handleOpenLink = (url: string, title: string) => {
    setViewerLink({ url, title });
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'cours': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      case 'lien': return 'bg-teal-100 text-teal-800';
      case 'devoir': return 'bg-red-100 text-red-800';
      case 'evaluation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (fileName: string, contentType?: string) => {
    if (contentType === 'lien') {
      return <LinkIcon className="h-5 w-5 text-teal-600" />;
    }
    const extension = fileName?.split('.').pop()?.toLowerCase();
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
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Contenu du Module</h2>
        {canEdit && (
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un élément
          </Button>
        )}
      </div>

      {contents.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {contents.map((content) => (
            <div key={content.id} className="bg-card border border-primary/10 rounded-xl p-4 sm:p-5 hover:shadow-lg hover:border-primary/20 transition-all">
              <div className="flex flex-col gap-3">
                {/* Header avec titre et type */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">{getFileIcon(content.file_name, content.content_type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{content.title}</h3>
                    <span className={`inline-block text-xs px-2.5 py-1 rounded-full mt-1.5 font-medium ${getContentTypeColor(content.content_type)}`}>
                      {content.content_type}
                    </span>
                  </div>
                </div>
                
                {content.description && (
                  <p className="text-muted-foreground text-xs sm:text-sm">{content.description}</p>
                )}
                
                {content.content_type === 'lien' && content.file_url && (
                  <button
                    onClick={() => handleOpenLink(content.file_url, content.title)}
                    className="flex items-center text-xs sm:text-sm text-primary hover:text-primary/80 hover:underline cursor-pointer truncate"
                  >
                    <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{content.file_url}</span>
                  </button>
                )}
                
                {content.content_type !== 'lien' && content.file_name && (
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg w-fit">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0 text-primary" />
                    <span className="truncate">{content.file_name}</span>
                  </div>
                )}
                
                {/* Boutons d'action - responsive */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-primary/10">
                  {content.content_type === 'lien' && content.file_url ? (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => handleOpenLink(content.file_url, content.title)}
                      className="flex-1 sm:flex-none text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/90"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Accéder
                    </Button>
                  ) : content.file_url ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleOpenFile(content.file_url, content.file_name || 'fichier')}
                        className="flex-1 sm:flex-none text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/90"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>Voir</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadFile(content.file_url, content.file_name || 'fichier')}
                        className="flex-1 sm:flex-none text-xs sm:text-sm border-primary/30 hover:bg-primary/5"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Télécharger</span>
                        <span className="sm:hidden">DL</span>
                      </Button>
                    </>
                  ) : null}
                  
                  {canEdit && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(content)}
                        className="h-9 w-9 p-0 hover:bg-primary/10"
                      >
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive h-9 w-9 p-0 hover:bg-destructive/10"
                        onClick={() => handleDelete(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Aucun contenu</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Aucun contenu n'a encore été ajouté à ce module.</p>
        </div>
      )}

      {showCreateModal && (
        <CreateContentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          moduleId={moduleId}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showEditModal && (
        <CreateContentModal
          isOpen={!!showEditModal}
          onClose={() => setShowEditModal(null)}
          moduleId={moduleId}
          onSuccess={handleEditSuccess}
          editContent={showEditModal}
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

      {viewerLink && (
        <LinkViewerModal
          isOpen={!!viewerLink}
          onClose={() => setViewerLink(null)}
          url={viewerLink.url}
          title={viewerLink.title}
        />
      )}
    </div>
  );
};

export default ModuleContentTab;
