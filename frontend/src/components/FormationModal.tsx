
import React, { useState, useEffect } from 'react';
import { X, BookOpen, User, Clock, Calendar } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Formation {
  id?: number;
  title: string;
  level: string;
  instructor: string;
  duration: string;
  startDate: string;
  endDate: string;
  description?: string;
}

interface FormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formationData: Formation) => void;
  formation: Formation | null;
  mode: 'create' | 'edit';
}

const FormationModal: React.FC<FormationModalProps> = ({ isOpen, onClose, onSave, formation, mode }) => {
  const [formData, setFormData] = useState<Formation>({
    title: '',
    level: 'BAC+1',
    instructor: '',
    duration: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  useEffect(() => {
    if (formation && mode === 'edit') {
      setFormData(formation);
    } else {
      setFormData({
        title: '',
        level: 'BAC+1',
        instructor: '',
        duration: '',
        startDate: '',
        endDate: '',
        description: ''
      });
    }
  }, [formation, mode, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'create' ? 'Nouvelle formation' : 'Modifier la formation'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Titre de la formation
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Niveau</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAC+1">BAC+1</SelectItem>
                  <SelectItem value="BAC+2">BAC+2</SelectItem>
                  <SelectItem value="BAC+3">BAC+3</SelectItem>
                  <SelectItem value="BAC+4">BAC+4</SelectItem>
                  <SelectItem value="BAC+5">BAC+5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Formateur
              </Label>
              <Input
                id="instructor"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durée (heures)
              </Label>
              <Input
                id="duration"
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de début
              </Label>
              <DatePicker
                value={formData.startDate}
                onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
                placeholder="Sélectionner une date"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de fin
              </Label>
              <DatePicker
                value={formData.endDate}
                onChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
                placeholder="Sélectionner une date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormationModal;
