import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, Calendar, Award, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { assignmentService, Assignment } from '@/services/assignmentService';
import { fileUploadService } from '@/services/fileUploadService';
import FileUpload from '@/components/ui/file-upload';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  onSuccess: () => void;
  editAssignment?: Assignment;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  onSuccess,
  editAssignment
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'devoir' as 'devoir' | 'evaluation',
    due_date: '',
    max_points: 100
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const { userId } = useCurrentUser();

  useEffect(() => {
    if (editAssignment) {
      setFormData({
        title: editAssignment.title,
        description: editAssignment.description || '',
        assignment_type: editAssignment.assignment_type as 'devoir' | 'evaluation',
        due_date: editAssignment.due_date ? new Date(editAssignment.due_date).toISOString().slice(0, 16) : '',
        max_points: editAssignment.max_points
      });
    } else {
      // Reset form when opening for creation
      setFormData({
        title: '',
        description: '',
        assignment_type: 'devoir',
        due_date: '',
        max_points: 100
      });
      setSelectedFiles([]);
    }
  }, [editAssignment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editAssignment) {
        await assignmentService.updateAssignment(editAssignment.id, {
          ...formData,
          due_date: formData.due_date || undefined
        });
      } else {
        if (!userId) {
          alert('Utilisateur non authentifié');
          return;
        }

        const assignment = await assignmentService.createAssignment({
          title: formData.title,
          description: formData.description,
          assignment_type: formData.assignment_type,
          module_id: moduleId,
          created_by: userId,
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
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(editAssignment ? 'Erreur lors de la modification du devoir' : 'Erreur lors de la création du devoir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            {editAssignment ? 'Modifier le devoir' : 'Créer un devoir'}
          </DialogTitle>
          <DialogDescription>
            {editAssignment 
              ? 'Modifiez les informations du devoir existant.'
              : 'Remplissez les informations pour créer un nouveau devoir ou évaluation.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Exercice chapitre 3"
                required
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.assignment_type}
                onValueChange={(value: 'devoir' | 'evaluation') => 
                  setFormData({ ...formData, assignment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="devoir">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Devoir
                    </span>
                  </SelectItem>
                  <SelectItem value="evaluation">
                    <span className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Évaluation
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Instructions détaillées pour les étudiants..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Date et Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date d'échéance
                </Label>
                <DateTimePicker
                  value={formData.due_date}
                  onChange={(value) => setFormData({ ...formData, due_date: value })}
                  placeholder="Sélectionner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_points" className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  Points maximum
                </Label>
                <Input
                  id="max_points"
                  type="number"
                  value={formData.max_points}
                  onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            {/* Fichiers joints (uniquement en création) */}
            {!editAssignment && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Fichiers joints
                </Label>
                <FileUpload
                  onFileSelect={setSelectedFiles}
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx"
                  maxSize={10}
                />
                {selectedFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFiles.length} fichier(s) sélectionné(s)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fixed footer with buttons */}
          <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.title.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {editAssignment ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <ClipboardList className="h-4 w-4" />
                    {editAssignment ? 'Modifier' : 'Créer le devoir'}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssignmentModal;
