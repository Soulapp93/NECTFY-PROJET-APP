import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScheduleSlot, scheduleService } from '@/services/scheduleService';
import { useFormations } from '@/hooks/useFormations';
import { useInstructors } from '@/hooks/useInstructors';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  slot: ScheduleSlot | null;
  formationId: string;
}

const EditSlotModal = ({ isOpen, onClose, onSuccess, slot, formationId }: EditSlotModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    module_id: '',
    instructor_id: '',
    date: '',
    start_time: '',
    end_time: '',
    room: '',
    color: '#8B5CF6',
    notes: ''
  });

  const { formations } = useFormations();
  const { instructors } = useInstructors();

  const formation = formations?.find(f => f.id === formationId);
  const modules = formation?.formation_modules || [];

  useEffect(() => {
    if (slot) {
      setFormData({
        module_id: slot.module_id || '',
        instructor_id: slot.instructor_id || '',
        date: slot.date,
        start_time: slot.start_time.slice(0, 5),
        end_time: slot.end_time.slice(0, 5),
        room: slot.room || '',
        color: slot.color || '#8B5CF6',
        notes: slot.notes || ''
      });
    }
  }, [slot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot) return;

    try {
      setLoading(true);
      
      await scheduleService.updateScheduleSlot(slot.id, {
        ...formData,
        module_id: formData.module_id || undefined,
        instructor_id: formData.instructor_id || undefined
      });

      toast.success('Créneau modifié avec succès');
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de la modification du créneau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier le créneau</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="module">Module</Label>
              <Select value={formData.module_id} onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Formateur</Label>
              <Select value={formData.instructor_id} onValueChange={(value) => setFormData(prev => ({ ...prev, instructor_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker
              id="date"
              value={formData.date}
              onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
              placeholder="Sélectionner une date"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Heure de début</Label>
              <TimePicker
                id="start_time"
                value={formData.start_time}
                onChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
                placeholder="Début"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Heure de fin</Label>
              <TimePicker
                id="end_time"
                value={formData.end_time}
                onChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
                placeholder="Fin"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Salle</Label>
              <Input
                id="room"
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                placeholder="Salle de cours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Couleur</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes additionnelles..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSlotModal;