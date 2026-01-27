import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { moduleContentService, ModuleContent } from '@/services/moduleContentService';
import { moduleDocumentService, ModuleDocument } from '@/services/moduleDocumentService';
import { assignmentService } from '@/services/assignmentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, Link2, Video, BookOpen, ClipboardCheck, GraduationCap, File } from 'lucide-react';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
  editContent?: ModuleContent | ModuleDocument;
}

const contentTypes = [
  { value: 'cours', label: 'Cours', icon: BookOpen },
  { value: 'support', label: 'Support', icon: FileText },
  { value: 'video', label: 'Vidéo', icon: Video },
  { value: 'document', label: 'Document', icon: File },
  { value: 'lien', label: 'Lien', icon: Link2 },
  { value: 'devoir', label: 'Devoir', icon: ClipboardCheck },
  { value: 'evaluation', label: 'Évaluation', icon: GraduationCap },
];

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
      const isDocument = 'document_type' in editContent;
      
      setFormData({
        title: editContent.title,
        description: editContent.description || '',
        content_type: isDocument 
          ? (editContent as ModuleDocument).document_type as any
          : (editContent as ModuleContent).content_type as any,
        link_url: editContent.file_url && editContent.file_url.startsWith('http') ? editContent.file_url : '',
        due_date: '',
        max_points: 100
      });
    } else {
      // Reset form when opening in create mode
      setFormData({
        title: '',
        description: '',
        content_type: 'cours',
        link_url: '',
        due_date: '',
        max_points: 100
      });
      setSelectedFiles([]);
      setError(null);
    }
  }, [editContent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Saving content with:', { formData, files: selectedFiles, editMode: !!editContent });

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
        if (editContent) {
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
        if (formData.content_type === 'document') {
          if (editContent) {
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
          if (editContent) {
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

  const selectedType = contentTypes.find(t => t.value === formData.content_type);
  const TypeIcon = selectedType?.icon || FileText;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TypeIcon className="h-5 w-5 text-primary" />
            </div>
            {editContent ? 'Modifier l\'élément' : 'Ajouter un élément'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Entrez le titre..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type de contenu *</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => setFormData({ ...formData, content_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ajoutez une description..."
                rows={3}
              />
            </div>

            {formData.content_type === 'lien' && (
              <div className="space-y-2">
                <Label htmlFor="link_url">URL du lien *</Label>
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://exemple.com"
                  required
                />
              </div>
            )}

            {(formData.content_type === 'devoir' || formData.content_type === 'evaluation') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date d'échéance</Label>
                  <DateTimePicker
                    value={formData.due_date}
                    onChange={(value) => setFormData({ ...formData, due_date: value })}
                    placeholder="Sélectionner date"
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

            {formData.content_type !== 'lien' && (
              <div className="space-y-2">
                <Label>
                  {editContent ? 'Nouveau fichier (optionnel)' : 'Fichier (optionnel)'}
                </Label>
                <FileUpload
                  onFileSelect={setSelectedFiles}
                  maxSize={50}
                  multiple={formData.content_type === 'devoir' || formData.content_type === 'evaluation'}
                />
                <p className="text-xs text-muted-foreground">
                  Tous types de fichiers acceptés (PDF, Word, Excel, PowerPoint, images, vidéos, audio, etc.)
                </p>
                {editContent?.file_name && selectedFiles.length === 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <File className="h-4 w-4" />
                    Fichier actuel: {editContent.file_name}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (editContent ? 'Modification...' : 'Création...') 
                : (editContent ? 'Modifier' : 'Ajouter')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContentModal;
