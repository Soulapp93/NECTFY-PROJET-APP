import React from 'react';
import { Clock, MapPin, User, Calendar, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleSlot } from '@/services/scheduleService';
import SlotActionMenu from './SlotActionMenu';

interface ScheduleDayViewProps {
  selectedDate: Date;
  slots: ScheduleSlot[];
  onEditSlot?: (slot: ScheduleSlot) => void;
  onDuplicateSlot?: (slot: ScheduleSlot) => void;
  onDeleteSlot?: (slot: ScheduleSlot) => void;
}

export const ScheduleDayView: React.FC<ScheduleDayViewProps> = ({ 
  selectedDate, 
  slots, 
  onEditSlot,
  onDuplicateSlot,
  onDeleteSlot
}) => {
  const daySlots = slots.filter(slot => 
    new Date(slot.date).toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Convertir le temps en minutes depuis minuit (supporte HH:MM et HH:MM:SS)
  const timeToMinutes = (time: string): number => {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    // Ignore les secondes si présentes
    return hours * 60 + minutes;
  };

  // Calculer la durée d'un créneau en format lisible
  const formatDuration = (slot: ScheduleSlot): string => {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const durationMinutes = endMinutes - startMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  };

  // Grille horaire continue de 8h00 à 00h00 (minuit)
  const START_HOUR = 8;
  const END_HOUR = 24;
  
  // Générer les créneaux horaires
  const timeSlots = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => {
      const hour = START_HOUR + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    }
  );

  // Détecter les chevauchements entre créneaux
  const detectOverlaps = (slots: ScheduleSlot[]) => {
    const overlapMap = new Map<string, { column: number; totalColumns: number }>();
    const sortedSlots = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    const columns: ScheduleSlot[][] = [];
    
    sortedSlots.forEach(slot => {
      const slotStart = timeToMinutes(slot.start_time);
      const slotEnd = timeToMinutes(slot.end_time);
      
      // Trouver une colonne libre pour ce slot
      let placedInColumn = -1;
      for (let i = 0; i < columns.length; i++) {
        const columnSlots = columns[i];
        const hasOverlap = columnSlots.some(existingSlot => {
          const existingStart = timeToMinutes(existingSlot.start_time);
          const existingEnd = timeToMinutes(existingSlot.end_time);
          return slotStart < existingEnd && slotEnd > existingStart;
        });
        
        if (!hasOverlap) {
          columns[i].push(slot);
          placedInColumn = i;
          break;
        }
      }
      
      // Si aucune colonne libre, créer une nouvelle colonne
      if (placedInColumn === -1) {
        columns.push([slot]);
        placedInColumn = columns.length - 1;
      }
      
      // Calculer le nombre total de colonnes nécessaires pour ce slot
      const totalColumns = columns.filter(col => 
        col.some(s => {
          const sStart = timeToMinutes(s.start_time);
          const sEnd = timeToMinutes(s.end_time);
          return slotStart < sEnd && slotEnd > sStart;
        })
      ).length;
      
      overlapMap.set(slot.id, { column: placedInColumn, totalColumns });
    });
    
    return overlapMap;
  };

  const overlapMap = detectOverlaps(daySlots);

  // Calculer la position et hauteur d'un créneau avec précision à la minute près
  const getSlotPosition = (slot: ScheduleSlot) => {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);
    const baseMinutes = START_HOUR * 60; // Début de la journée à 8h
    
    const HOUR_HEIGHT = 80; // Hauteur d'une heure en pixels (1h = 80px)
    
    // Limiter l'affichage à la plage horaire visible
    const visibleStartMinutes = Math.max(startMinutes, baseMinutes);
    const visibleEndMinutes = Math.min(endMinutes, END_HOUR * 60);
    
    // Position exacte à la minute près
    const top = ((visibleStartMinutes - baseMinutes) / 60) * HOUR_HEIGHT;
    // Hauteur proportionnelle à la durée (1h = 80px, 2h = 160px, etc.)
    const height = ((visibleEndMinutes - visibleStartMinutes) / 60) * HOUR_HEIGHT;
    
    return { top, height: Math.max(height, 60) }; // Hauteur minimum 60px pour lisibilité
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {daySlots.length} cours programmé{daySlots.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Layout principal: Timeline (66%) + Liste (33%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline - 2/3 de l'espace */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  Planning de la journée
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex">
                {/* Colonne des heures avec fond coloré */}
                <div className="flex-shrink-0 w-16 bg-muted/30 border-r border-border">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-20 flex items-start justify-center pt-1 border-b border-border/20">
                      <span className="text-xs text-muted-foreground font-semibold">{time}</span>
                    </div>
                  ))}
                </div>
                
                {/* Zone des cours */}
                <div className="flex-1 relative" style={{ height: `${(END_HOUR - START_HOUR) * 80}px` }}>
                  {/* Lignes de grille horizontales avec séparateurs clairs */}
                  {timeSlots.map((time, index) => (
                    <div 
                      key={time} 
                      className="absolute w-full border-b border-border/30"
                      style={{ top: `${index * 80}px`, height: '80px' }}
                    />
                  ))}
                  
                  {/* Créneaux de cours positionnés absolument avec gestion des chevauchements */}
                  {daySlots.map((slot, index) => {
                    const { top, height } = getSlotPosition(slot);
                    const duration = formatDuration(slot);
                    const durationMinutes = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
                    
                    // Récupérer les infos de chevauchement
                    const overlapInfo = overlapMap.get(slot.id);
                    const column = overlapInfo?.column ?? 0;
                    const totalColumns = overlapInfo?.totalColumns ?? 1;
                    
                    // Calculer la largeur et la position en fonction des chevauchements
                    const widthPercent = 100 / totalColumns;
                    const leftPercent = (column * 100) / totalColumns;
                    
                    // Affichage adaptatif selon la durée
                    const showInstructor = durationMinutes >= 60; // >= 1h
                    const showFullInfo = durationMinutes >= 120; // >= 2h
                    
                    return (
                      <div
                        key={slot.id || index}
                        className="absolute rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                        style={{ 
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${leftPercent}% + 8px)`,
                          width: `calc(${widthPercent}% - ${totalColumns > 1 ? '12px' : '16px'})`,
                          backgroundColor: slot.color || '#3B82F6',
                          minHeight: '60px'
                        }}
                        onClick={() => onEditSlot?.(slot)}
                      >
                        {/* Animation de brillance au survol */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        
                        <div className="relative h-full p-3 flex flex-col text-white">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm leading-tight truncate">
                                {slot.session_type === 'autonomie' ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module')}
                              </h4>
                              {/* Badge de durée */}
                              <Badge 
                                variant="secondary" 
                                className="mt-1 text-xs px-1.5 py-0 h-5 bg-white/20 text-white border-0 hover:bg-white/30"
                              >
                                {duration}
                              </Badge>
                            </div>
                            {onEditSlot && onDuplicateSlot && onDeleteSlot && (
                              <SlotActionMenu 
                                slot={slot}
                                onEdit={onEditSlot}
                                onDuplicate={onDuplicateSlot}
                                onDelete={onDeleteSlot}
                              />
                            )}
                          </div>
                          
                          <div className="space-y-1 text-xs mt-auto">
                            <div className="flex items-center text-white/90">
                              <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span>{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</span>
                            </div>
                            
                            {slot.session_type !== 'autonomie' && slot.room && (
                              <div className="flex items-center text-white/90">
                                <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{slot.room}</span>
                              </div>
                            )}
                            
                            {/* Afficher instructeur si durée >= 1h et pas en autonomie */}
                            {showInstructor && slot.session_type !== 'autonomie' && slot.users && (
                              <div className="flex items-center text-white/90">
                                <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{slot.users.first_name} {slot.users.last_name}</span>
                              </div>
                            )}
                            
                            {/* Afficher notes pour autonomie */}
                            {slot.session_type === 'autonomie' && slot.notes && (
                              <div className="mt-1 pt-1 border-t border-white/20">
                                <p className="text-xs text-white/80 truncate">
                                  {slot.notes}
                                </p>
                              </div>
                            )}
                            
                            {/* Afficher formation complète si durée >= 2h et pas autonomie */}
                            {showFullInfo && slot.session_type !== 'autonomie' && (
                              <div className="mt-1 pt-1 border-t border-white/20">
                                <p className="text-xs text-white/80 truncate">
                                  Formation
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste résumée - 1/3 de l'espace */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-border/50 sticky top-6">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center space-x-2">
                <List className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  Liste des cours
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {daySlots.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Aucun cours programmé
                </p>
              ) : (
                daySlots.map((slot, index) => {
                  const duration = formatDuration(slot);
                  return (
                    <Card 
                      key={slot.id || index}
                      className="overflow-hidden cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 border-l-4"
                      style={{ borderLeftColor: slot.color || '#3B82F6' }}
                      onClick={() => onEditSlot?.(slot)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm text-foreground leading-tight truncate">
                              {slot.session_type === 'autonomie' ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module')}
                            </h5>
                            {/* Badge formation avec couleur assortie - masqué pour autonomie */}
                            {slot.session_type !== 'autonomie' && (
                            <Badge 
                              variant="secondary" 
                              className="mt-1 text-xs"
                              style={{ 
                                backgroundColor: `${slot.color || '#3B82F6'}15`,
                                color: slot.color || '#3B82F6',
                                borderColor: slot.color || '#3B82F6'
                              }}
                            >
                              Formation
                            </Badge>
                            )}
                          </div>
                          {/* Numéro de cours dans un cercle coloré */}
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-2 shadow-sm"
                            style={{ backgroundColor: slot.color || '#3B82F6' }}
                          >
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            <span className="font-medium">{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</span>
                            <span className="ml-1 text-muted-foreground/70">({duration})</span>
                          </div>
                          {slot.session_type !== 'autonomie' && slot.room && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{slot.room}</span>
                            </div>
                          )}
                          {slot.session_type !== 'autonomie' && slot.users && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{slot.users.first_name} {slot.users.last_name}</span>
                            </div>
                          )}
                          {slot.session_type === 'autonomie' && slot.notes && (
                            <div className="text-xs text-muted-foreground italic truncate">
                              {slot.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};