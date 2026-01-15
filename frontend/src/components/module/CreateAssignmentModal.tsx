
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
    }
  }, [editAssignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editAssignment) {
        // Mode édition
        await assignmentService.updateAssignment(editAssignment.id, {
          ...formData,
          due_date: formData.due_date || undefined
        });
      } else {
        // Mode création
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
        
        console.log('Devoir créé:', assignment);

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
      }

      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        assignment_type: 'devoir',
        due_date: '',
        max_points: 100
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(editAssignment ? 'Erreur lors de la modification du devoir' : 'Erreur lors de la création du devoir');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {editAssignment ? 'Modifier le devoir' : 'Créer un devoir'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              Type *
            </label>
            <select
              value={formData.assignment_type}
              onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="devoir">Devoir</option>
              <option value="evaluation">Évaluation</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

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
                onChange={(e) => setFormData({ ...formData, max_points: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>
          </div>

          {!editAssignment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichiers joints
              </label>
              <FileUpload
                onFileSelect={setSelectedFiles}
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                maxSize={10}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editAssignment ? 'Modification...' : 'Création...') : (editAssignment ? 'Modifier' : 'Créer le devoir')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
