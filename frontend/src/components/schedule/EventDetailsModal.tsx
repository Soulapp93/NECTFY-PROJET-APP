import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Book,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  instructor: string;
  room: string;
  formation: string;
  color: string;
  description?: string;
}

interface EventDetailsModalProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (eventId: string) => void;
  onDuplicate?: (event: ScheduleEvent) => void;
  canEdit?: boolean;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canEdit = false,
}) => {
  if (!event) return null;

  // Formater les heures pour afficher uniquement HH:MM
  const formatTime = (time: string) => {
    return time.split(':').slice(0, 2).join(':');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
            />
            <span className="text-xl font-semibold">{event.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date et heure - Style Card */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Date</p>
                <p className="text-sm font-medium">
                  {format(event.date, 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Horaire</p>
                <p className="text-sm font-medium">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informations détaillées */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Détails du cours</h3>
            
            <div className="grid gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Formateur</p>
                  <p className="text-sm font-medium truncate">{event.instructor}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Salle</p>
                  <p className="text-sm font-medium truncate">{event.room}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Book className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Formation</p>
                  <p className="text-sm font-medium">{event.formation}</p>
                </div>
              </div>
            </div>
          </div>

          {event.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
              </div>
            </>
          )}

          {/* Actions pour l'administration */}
          {canEdit && (onEdit || onDelete) && (
            <>
              <Separator />
              <div className="flex gap-2 pt-2">
                {onEdit && (
                  <Button
                    onClick={() => {
                      onEdit(event);
                      onClose();
                    }}
                    className="flex-1"
                    variant="default"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                {onDelete && (
                  <Button
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
                        onDelete(event.id);
                        onClose();
                      }
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};