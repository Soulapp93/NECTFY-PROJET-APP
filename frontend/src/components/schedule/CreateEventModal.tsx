import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, X, Sparkles, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { scheduleService } from '@/services/scheduleService';
import { useFormations } from '@/hooks/useFormations';
import { useUsers } from '@/hooks/useUsers';

interface CreateEventModalProps {
  onEventCreated?: (event: ScheduleEvent) => void;
  scheduleId?: string;
  preselectedDate?: Date;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  instructor: string;
  room: string;
  formation: string;
  formationId?: string;
  description?: string;
  color: string;
  sessionType?: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ 
  onEventCreated, 
  scheduleId, 
  preselectedDate,
  isOpen,
  onOpenChange 
}) => {
  const [open, setOpen] = useState(isOpen || false);
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    date: preselectedDate || undefined as Date | undefined,
    startTime: '',
    endTime: '',
    instructor: '',
    room: '',
    formation: '',
    description: '',
    color: '#8B5CF6'
  });
  
  const { toast } = useToast();
  const { formations } = useFormations();
  const { users } = useUsers();

  // Effet pour synchroniser les props avec l'état local
  useEffect(() => {
    if (isOpen !== undefined) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedDate) {
      setEventData(prev => ({ ...prev, date: preselectedDate }));
    }
  }, [preselectedDate]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  // Filtrer les formateurs
  const instructors = users?.filter(user => user.role === 'Formateur') || [];

  const rooms = ['Salle A1', 'Salle B2', 'Salle C3', 'Amphithéâtre', 'Atelier'];

  const colors = [
    '#8B5CF6', // Violet (couleur de l'app)
    '#3B82F6', // Bleu
    '#10B981', // Vert
    '#F59E0B', // Orange
    '#EF4444', // Rouge
    '#EC4899'  // Rose
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation avec logs détaillés
    if (!eventData.formation) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un module.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.date) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.startTime) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une heure de début.",
        variant: "destructive",
      });
      return;
    }
    
    if (!eventData.endTime) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une heure de fin.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Si on a un scheduleId, créer le slot directement dans la base de données
      if (scheduleId) {
        const slotData = {
          schedule_id: scheduleId,
          module_id: null,
          instructor_id: eventData.instructor || null,
          date: format(eventData.date, 'yyyy-MM-dd'),
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          room: eventData.room || null,
          color: eventData.color,
          notes: eventData.description || null
        };

        await scheduleService.createScheduleSlot(slotData);
      }

      const newEvent: ScheduleEvent = {
        id: Date.now().toString(),
        title: eventData.title,
        date: eventData.date,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        instructor: eventData.instructor,
        room: eventData.room,
        formation: eventData.formation,
        description: eventData.description,
        color: eventData.color
      };

      onEventCreated?.(newEvent);

      toast({
        title: "✨ Cours créé avec succès !",
        description: "Le nouveau cours a été ajouté à votre emploi du temps.",
      });

      setEventData({
        title: '',
        date: undefined,
        startTime: '',
        endTime: '',
        instructor: '',
        room: '',
        formation: '',
        description: '',
        color: '#8B5CF6'
      });
      
      setOpen(false);
      onOpenChange?.(false);
    } catch (error) {
      console.error('Error creating schedule slot:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du cours.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="nect-gradient hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105">
          <Plus className="h-4 w-4 mr-2" />
          <Sparkles className="h-4 w-4 mr-1" />
          Nouveau cours
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md p-0 glass-card rounded-2xl border-primary/20 overflow-hidden">
        {/* Header avec gradient */}
        <div className="nect-gradient p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Ajouter un créneau
                </DialogTitle>
                <DialogDescription className="text-white/80 text-sm">
                  Créez un nouveau cours dans votre emploi du temps
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleOpenChange(false)}
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom du module */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="p-1 bg-primary/10 rounded">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              Nom du module *
            </Label>
            <Select 
              value={eventData.formation} 
              onValueChange={(value) => setEventData(prev => ({ ...prev, formation: value, title: value }))}
            >
              <SelectTrigger className="w-full bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 text-primary focus:border-primary/40 hover:border-primary/30 transition-all duration-200">
                <SelectValue placeholder="Sélectionner un module" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-sm border-primary/20">
                {formations?.map((formation) => (
                  <SelectItem key={formation.id} value={formation.title}>{formation.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date et Heures */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="p-1 bg-blue-500/10 rounded">
                  <CalendarIcon className="h-3 w-3 text-blue-500" />
                </div>
                Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-center text-xs px-3 py-3 h-auto bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-blue-500/20 hover:border-blue-500/30 transition-all duration-200"
                  >
                    {eventData.date ? format(eventData.date, "dd/MM") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-card border-primary/20" align="start">
                  <Calendar
                    mode="single"
                    selected={eventData.date}
                    onSelect={(date) => setEventData(prev => ({ ...prev, date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="p-1 bg-green-500/10 rounded">
                  <Clock className="h-3 w-3 text-green-500" />
                </div>
                Début *
              </Label>
              <Select 
                value={eventData.startTime} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, startTime: value }))}
              >
                <SelectTrigger className="w-full text-xs px-3 py-3 h-auto bg-gradient-to-r from-green-500/5 to-green-500/10 border-green-500/20 hover:border-green-500/30 transition-all duration-200">
                  <SelectValue placeholder="08:00" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60 bg-white border border-gray-200 shadow-lg">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time} className="cursor-pointer hover:bg-gray-100">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="p-1 bg-orange-500/10 rounded">
                  <Clock className="h-3 w-3 text-orange-500" />
                </div>
                Fin *
              </Label>
              <Select 
                value={eventData.endTime} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, endTime: value }))}
              >
                <SelectTrigger className="w-full text-xs px-3 py-3 h-auto bg-gradient-to-r from-orange-500/5 to-orange-500/10 border-orange-500/20 hover:border-orange-500/30 transition-all duration-200">
                  <SelectValue placeholder="10:00" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60 bg-white border border-gray-200 shadow-lg">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time} className="cursor-pointer hover:bg-gray-100">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salle et Formateur */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="p-1 bg-purple-500/10 rounded">
                  <MapPin className="h-3 w-3 text-purple-500" />
                </div>
                Salle
              </Label>
              <Input
                placeholder="Salle A1"
                value={eventData.room}
                onChange={(e) => setEventData(prev => ({ ...prev, room: e.target.value }))}
                className="text-sm bg-gradient-to-r from-purple-500/5 to-purple-500/10 border-purple-500/20 focus:border-purple-500/40 hover:border-purple-500/30 transition-all duration-200"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <div className="p-1 bg-indigo-500/10 rounded">
                  <User className="h-3 w-3 text-indigo-500" />
                </div>
                Formateur
              </Label>
              <Select 
                value={eventData.instructor} 
                onValueChange={(value) => setEventData(prev => ({ ...prev, instructor: value }))}
              >
                <SelectTrigger className="w-full text-sm bg-gradient-to-r from-indigo-500/5 to-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200">
                  <SelectValue placeholder="Choisir un formateur" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border-primary/20">
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Couleur du créneau */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="p-1 bg-pink-500/10 rounded">
                <Sparkles className="h-3 w-3 text-pink-500" />
              </div>
              Couleur du créneau
            </Label>
            <div className="flex gap-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEventData(prev => ({ ...prev, color: color }))}
                  className={cn(
                    "w-10 h-10 rounded-xl border-3 transition-all duration-200 hover:scale-110 shadow-lg",
                    eventData.color === color 
                      ? "border-white scale-110 shadow-xl ring-2 ring-primary/50" 
                      : "border-white/50 hover:border-white/80"
                  )}
                  style={{ 
                    backgroundColor: color,
                    boxShadow: eventData.color === color 
                      ? `0 8px 25px ${color}40` 
                      : `0 4px 15px ${color}30`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">Notes complémentaires</Label>
            <Textarea
              placeholder="Ajoutez des informations supplémentaires sur ce cours..."
              value={eventData.description}
              onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="text-sm resize-none bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-primary/40 hover:border-slate-300 transition-all duration-200"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-6 border-t border-primary/10">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1 nect-gradient hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Création...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ajouter le créneau
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};