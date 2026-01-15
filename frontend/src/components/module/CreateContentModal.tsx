
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { moduleContentService, ModuleContent } from '@/services/moduleContentService';
import { moduleDocumentService, ModuleDocument } from '@/services/moduleDocumentService';
import { assignmentService } from '@/services/assignmentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
  editContent?: ModuleContent | ModuleDocument;
}

const CreateContentModal: React.FC<CreateContentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  onSuccess,
  editContent
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'cours' as 'cours' | 'support' | 'video' | 'document' | 'devoir' | 'evaluation' | 'lien',
    link_url: '',
    due_date: '',
    max_points: 100
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editContent) {
      // Déterminer le type d'objet en fonction des propriétés disponibles
      const isDocument = 'document_type' in editContent;
      
      setFormData({
        title: editContent.title,
        description: editContent.description || '',
        content_type: isDocument 
          ? (editContent as ModuleDocument).document_type as 'cours' | 'support' | 'video' | 'document' | 'devoir' | 'evaluation' | 'lien'
          : (editContent as ModuleContent).content_type as 'cours' | 'support' | 'video' | 'document' | 'devoir' | 'evaluation' | 'lien',
        link_url: editContent.file_url && editContent.file_url.startsWith('http') ? editContent.file_url : '',
        due_date: '',
        max_points: 100
      });
    }
  }, [editContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Saving content with:', { formData, files: selectedFiles, editMode: !!editContent });

      // Si c'est un devoir ou évaluation, créer via assignmentService
      if (formData.content_type === 'devoir' || formData.content_type === 'evaluation') {
        if (!editContent) {
          console.log('Creating assignment:', formData);
          const assignment = await assignmentService.createAssignment({
            title: formData.title,
            description: formData.description,
            assignment_type: formData.content_type,
            module_id: moduleId,
            created_by: '00000000-0000-0000-0000-000000000001',
            is_published: true,
            due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
            max_points: formData.max_points
          });

          // Uploader les fichiers si il y en a
          if (selectedFiles.length > 0) {
            for (const file of selectedFiles) {
              const fileUrl = await fileUploadService.uploadFile(file);
              await assignmentService.addAssignmentFile({
                assignment_id: assignment.id,
                file_url: fileUrl,
                file_name: file.name,
                file_size: file.size
              });
            }
          }
          console.log('Assignment created successfully:', assignment);
        }
      } else if (formData.content_type === 'lien') {
        // Traitement pour les liens
        if (editContent) {
          // Mode édition lien
          const contentData = {
            title: formData.title,
            description: formData.description,
            content_type: formData.content_type,
            file_url: formData.link_url,
            file_name: formData.title
          };

          console.log('Updating link in database:', contentData);
          await moduleContentService.updateContent(editContent.id, contentData);
          console.log('Link updated successfully');
        } else {
          // Mode création lien
          const contentData = {
            title: formData.title,
            description: formData.description,
            content_type: formData.content_type,
            module_id: moduleId,
            file_url: formData.link_url,
            file_name: formData.title
          };

          console.log('Creating link in database:', contentData);
          await moduleContentService.createContent(contentData);
          console.log('Link created successfully');
        }
      } else {
        // Traitement pour les documents
        if (formData.content_type === 'document') {
          if (editContent) {
            // Mode édition document
            let fileUrl = editContent.file_url;
            let fileName = editContent.file_name;

            if (selectedFiles.length > 0) {
              console.log('Uploading new file:', selectedFiles[0]);
              fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
              fileName = selectedFiles[0].name;
              console.log('New file uploaded, URL:', fileUrl);
            }

            const documentData = {
              title: formData.title,
              description: formData.description,
              document_type: formData.content_type,
              file_url: fileUrl,
              file_name: fileName
            };

            console.log('Updating document in database:', documentData);
            await moduleDocumentService.updateDocument(editContent.id, documentData);
            console.log('Document updated successfully');
          } else {
            // Mode création document
            let fileUrl = null;
            let fileName = null;

            if (selectedFiles.length > 0) {
              console.log('Uploading file:', selectedFiles[0]);
              fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
              fileName = selectedFiles[0].name;
              console.log('File uploaded, URL:', fileUrl);
            }

            const documentData = {
              title: formData.title,
              description: formData.description,
              document_type: formData.content_type,
              module_id: moduleId,
              file_url: fileUrl,
              file_name: fileName
            };

            console.log('Creating document in database:', documentData);
            await moduleDocumentService.createDocument(documentData);
            console.log('Document created successfully');
          }
        } else {
          // Traitement pour les autres types de contenu (cours, support, video)
          if (editContent) {
            // Mode édition contenu
            let fileUrl = editContent.file_url;
            let fileName = editContent.file_name;

            if (selectedFiles.length > 0) {
              console.log('Uploading new file:', selectedFiles[0]);
              fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
              fileName = selectedFiles[0].name;
              console.log('New file uploaded, URL:', fileUrl);
            }

            const contentData = {
              title: formData.title,
              description: formData.description,
              content_type: formData.content_type,
              file_url: fileUrl,
              file_name: fileName
            };

            console.log('Updating content in database:', contentData);
            await moduleContentService.updateContent(editContent.id, contentData);
            console.log('Content updated successfully');
          } else {
            // Mode création contenu
            let fileUrl = null;
            let fileName = null;

            if (selectedFiles.length > 0) {
              console.log('Uploading file:', selectedFiles[0]);
              fileUrl = await fileUploadService.uploadFile(selectedFiles[0]);
              fileName = selectedFiles[0].name;
              console.log('File uploaded, URL:', fileUrl);
            }

            const contentData = {
              title: formData.title,
              description: formData.description,
              content_type: formData.content_type,
              module_id: moduleId,
              file_url: fileUrl,
              file_name: fileName
            };

            console.log('Creating content in database:', contentData);
            await moduleContentService.createContent(contentData);
            console.log('Content created successfully');
          }
        }
      }

      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        content_type: 'cours',
        link_url: '',
        due_date: '',
        max_points: 100
      });
      setSelectedFiles([]);
    } catch (error: any) {
      console.error('Error saving content:', error);
      setError(error.message || (editContent ? 'Erreur lors de la modification du contenu' : 'Erreur lors de la création du contenu'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {editContent ? 'Modifier l\'élément' : 'Ajouter un élément'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de contenu *
            </label>
            <select
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cours">Cours</option>
              <option value="support">Support</option>
              <option value="video">Vidéo</option>
              <option value="document">Document</option>
              <option value="lien">Lien</option>
              <option value="devoir">Devoir</option>
              <option value="evaluation">Évaluation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Champ spécifique aux liens */}
          {formData.content_type === 'lien' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL du lien *
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://exemple.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {/* Champs spécifiques aux devoirs et évaluations */}
          {(formData.content_type === 'devoir' || formData.content_type === 'evaluation') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date d'échéance</Label>
                <DateTimePicker
                  value={formData.due_date}
                  onChange={(value) => setFormData({ ...formData, due_date: value })}
                  placeholder="Sélectionner date et heure"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_points">Points maximum</Label>
                <Input
                  id="max_points"
                  type="number"
                  value={formData.max_points}
                  onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            </div>
          )}

          {/* Zone de fichiers - cachée pour les liens */}
          {formData.content_type !== 'lien' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editContent ? 'Nouveau fichier (optionnel)' : 'Fichier (optionnel)'}
              </label>
              <FileUpload
                onFileSelect={setSelectedFiles}
                maxSize={50}
                multiple={formData.content_type === 'devoir' || formData.content_type === 'evaluation'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tous types de fichiers acceptés (PDF, Word, Excel, PowerPoint, images, vidéos, audio, etc.)
              </p>
              {editContent?.file_name && selectedFiles.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Fichier actuel: {editContent.file_name}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editContent ? 'Modification...' : 'Création...') : (editContent ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContentModal;
