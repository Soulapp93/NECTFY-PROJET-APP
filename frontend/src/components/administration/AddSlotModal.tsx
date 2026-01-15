import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Users, UserX, Info, Clock, MapPin, Palette } from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';
import { useInstructors } from '@/hooks/useInstructors';
import { scheduleService } from '@/services/scheduleService';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleId: string;
  formationId: string;
  selectedSlot: { date: string; time: string } | null;
}

const colors = [
  { value: '#8B5CF6', label: 'Violet', bgClass: 'bg-violet-500' },
  { value: '#3B82F6', label: 'Bleu', bgClass: 'bg-blue-500' },
  { value: '#10B981', label: 'Vert', bgClass: 'bg-green-500' },
  { value: '#F59E0B', label: 'Orange', bgClass: 'bg-orange-500' },
  { value: '#EF4444', label: 'Rouge', bgClass: 'bg-red-500' },
  { value: '#EC4899', label: 'Rose', bgClass: 'bg-pink-500' },
];

const AddSlotModal: React.FC<AddSlotModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  scheduleId,
  formationId,
  selectedSlot
}) => {
  const { formations } = useFormations();
  const { instructors } = useInstructors();
  const [loading, setLoading] = useState(false);

  const formation = formations.find(f => f.id === formationId);
  const modules = formation?.formation_modules || [];

  const [formData, setFormData] = useState({
    module_id: '',
    instructor_id: '',
    date: selectedSlot?.date || '',
    start_time: selectedSlot?.time || '',
    end_time: '',
    room: '',
    color: '#8B5CF6',
    notes: '',
    session_type: 'encadree' as 'encadree' | 'autonomie'
  });

  React.useEffect(() => {
    if (selectedSlot) {
      setFormData(prev => ({
        ...prev,
        date: selectedSlot.date,
        start_time: selectedSlot.time,
        end_time: selectedSlot.time
      }));
    }
  }, [selectedSlot]);

  React.useEffect(() => {
    if (formData.session_type === 'autonomie') {
      setFormData(prev => ({ ...prev, instructor_id: '', module_id: '', room: '' }));
    }
  }, [formData.session_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.session_type === 'encadree' && !formData.module_id) {
      toast.error('Veuillez sélectionner un module');
      return;
    }
    
    if (!formData.date || !formData.start_time || !formData.end_time) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast.error('L\'heure de fin doit être postérieure à l\'heure de début');
      return;
    }

    setLoading(true);
    try {
      await scheduleService.createScheduleSlot({
        schedule_id: scheduleId,
        module_id: formData.module_id || undefined,
        instructor_id: formData.session_type === 'encadree' ? (formData.instructor_id || undefined) : undefined,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room: formData.room || undefined,
        color: formData.color,
        notes: formData.notes || undefined,
        session_type: formData.session_type
      });
      
      setFormData({
        module_id: '',
        instructor_id: '',
        date: '',
        start_time: '',
        end_time: '',
        room: '',
        color: '#8B5CF6',
        notes: '',
        session_type: 'encadree'
      });
      onSuccess();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du créneau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">Ajouter un créneau</DialogTitle>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5 truncate">
                Créer un nouveau créneau
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type de session */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Type de session *
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, session_type: 'encadree' }))}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                      formData.session_type === 'encadree'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${formData.session_type === 'encadree' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-medium text-xs sm:text-sm ${formData.session_type === 'encadree' ? 'text-primary' : 'text-foreground'}`}>
                      Session encadrée
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      Avec formateur • QR Code
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, session_type: 'autonomie' }))}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                      formData.session_type === 'autonomie'
                        ? 'border-info bg-info/10'
                        : 'border-border hover:border-info/50 bg-card'
                    }`}
                  >
                    <UserX className={`h-5 w-5 sm:h-6 sm:w-6 ${formData.session_type === 'autonomie' ? 'text-info' : 'text-muted-foreground'}`} />
                    <span className={`font-medium text-xs sm:text-sm ${formData.session_type === 'autonomie' ? 'text-info' : 'text-foreground'}`}>
                      Session autonomie
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight">
                      Sans formateur • Lien
                    </span>
                  </button>
                </div>
                {formData.session_type === 'autonomie' && (
                  <div className="flex items-start gap-2 p-3 bg-info/10 rounded-lg text-xs sm:text-sm">
                    <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
                    <span className="text-info">
                      Sessions en autonomie : émargement via lien uniquement.
                    </span>
                  </div>
                )}
              </div>

              {/* Module */}
              {formData.session_type === 'encadree' && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Nom du module *
                  </Label>
                  <Select value={formData.module_id} onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value }))}>
                    <SelectTrigger className="h-11 bg-card">
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
              )}

              {/* Date et heures */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Date et horaires *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Date</span>
                    <DatePicker
                      id="date"
                      value={formData.date}
                      onChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
                      placeholder="Sélectionner"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:contents">
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Début</span>
                      <TimePicker
                        id="start_time"
                        value={formData.start_time}
                        onChange={(value) => setFormData(prev => ({ ...prev, start_time: value }))}
                        placeholder="00:00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Fin</span>
                      <TimePicker
                        id="end_time"
                        value={formData.end_time}
                        onChange={(value) => setFormData(prev => ({ ...prev, end_time: value }))}
                        placeholder="00:00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Salle et Formateur */}
              {formData.session_type === 'encadree' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Salle
                    </Label>
                    <Input
                      id="room"
                      value={formData.room}
                      onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                      placeholder="Ex: Salle A1"
                      className="h-11 bg-card"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Formateur
                    </Label>
                    <Select value={formData.instructor_id} onValueChange={(value) => setFormData(prev => ({ ...prev, instructor_id: value }))}>
                      <SelectTrigger className="h-11 bg-card">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Couleur */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Couleur
                </Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all ${
                        color.bgClass
                      } ${
                        formData.color === color.value 
                          ? 'ring-2 ring-offset-2 ring-foreground/30 scale-105' 
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Notes (optionnel)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informations complémentaires..."
                  rows={2}
                  className="bg-card resize-none text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="h-11 px-6 rounded-full"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-11 px-6 rounded-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Ajout...' : 'Ajouter le créneau'}
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AddSlotModal;
