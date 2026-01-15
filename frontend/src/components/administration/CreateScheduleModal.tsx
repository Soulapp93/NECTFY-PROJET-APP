import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays } from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';
import { scheduleService } from '@/services/scheduleService';
import { toast } from 'sonner';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { formations } = useFormations();
  const [formData, setFormData] = useState({
    title: '',
    formation_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.formation_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      
      await scheduleService.createSchedule({
        title: formData.title,
        formation_id: formData.formation_id,
        academic_year: academicYear,
        status: 'Brouillon'
      });
      
      setFormData({
        title: '',
        formation_id: ''
      });
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  };

  const handleFormationSelect = (value: string) => {
    const selectedFormation = formations.find(f => f.id === value);
    setFormData(prev => ({
      ...prev,
      formation_id: value,
      title: selectedFormation ? `Emploi du temps - ${selectedFormation.title}` : ''
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-primary-foreground" />
            </div>
            Créer un Emploi du Temps
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formation">1. Choisir une formation *</Label>
            <Select value={formData.formation_id} onValueChange={handleFormationSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une formation" />
              </SelectTrigger>
              <SelectContent>
                {formations.map((formation) => (
                  <SelectItem key={formation.id} value={formation.id}>
                    {formation.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">2. Titre de l'emploi du temps *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Emploi du temps - Formation Marketing"
            />
          </div>


          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Création...' : 'Créer l\'emploi du temps'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateScheduleModal;