import React from 'react';
import { Clock, MapPin, User, Book, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleEvent } from './CreateEventModal';

interface DayViewProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
}

export const DayView: React.FC<DayViewProps> = ({ selectedDate, events, onEventClick }) => {
  const dayEvents = events.filter(event => 
    event.date.toDateString() === selectedDate.toDateString()
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Convertir le temps en minutes depuis minuit (supporte HH:MM et HH:MM:SS)
  const timeToMinutes = (time: string): number => {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  };

  // Calculer la durée d'un événement en format lisible
  const formatDuration = (event: ScheduleEvent): string => {
    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const durationMinutes = endMinutes - startMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  };

  // Plage horaire étendue: 7h à 22h
  const START_HOUR = 7;
  const END_HOUR = 22;
  
  // Générer les créneaux horaires
  const timeSlots = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => {
      const hour = START_HOUR + i;
      return `${hour.toString().padStart(2, '0')}:00`;
    }
  );

  // Détecter les chevauchements entre événements
  const detectOverlaps = (events: ScheduleEvent[]) => {
    const overlapMap = new Map<string, { column: number; totalColumns: number }>();
    const sortedEvents = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const columns: ScheduleEvent[][] = [];
    
    sortedEvents.forEach(event => {
      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = timeToMinutes(event.endTime);
      
      // Trouver une colonne libre pour cet événement
      let placedInColumn = -1;
      for (let i = 0; i < columns.length; i++) {
        const columnEvents = columns[i];
        const hasOverlap = columnEvents.some(existingEvent => {
          const existingStart = timeToMinutes(existingEvent.startTime);
          const existingEnd = timeToMinutes(existingEvent.endTime);
          return eventStart < existingEnd && eventEnd > existingStart;
        });
        
        if (!hasOverlap) {
          columns[i].push(event);
          placedInColumn = i;
          break;
        }
      }
      
      // Si aucune colonne libre, créer une nouvelle colonne
      if (placedInColumn === -1) {
        columns.push([event]);
        placedInColumn = columns.length - 1;
      }
      
      // Calculer le nombre total de colonnes nécessaires pour cet événement
      const totalColumns = columns.filter(col => 
        col.some(e => {
          const eStart = timeToMinutes(e.startTime);
          const eEnd = timeToMinutes(e.endTime);
          return eventStart < eEnd && eventEnd > eStart;
        })
      ).length;
      
      overlapMap.set(event.id, { column: placedInColumn, totalColumns });
    });
    
    return overlapMap;
  };

  const overlapMap = detectOverlaps(dayEvents);

  // Calculer la position et hauteur d'un événement
  const getEventPosition = (event: ScheduleEvent) => {
    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = timeToMinutes(event.endTime);
    const baseMinutes = START_HOUR * 60;
    
    const HOUR_HEIGHT = 80; // Hauteur d'une heure en pixels
    
    // Limiter l'affichage à la plage horaire visible
    const visibleStartMinutes = Math.max(startMinutes, baseMinutes);
    const visibleEndMinutes = Math.min(endMinutes, END_HOUR * 60);
    
    const top = ((visibleStartMinutes - baseMinutes) / 60) * HOUR_HEIGHT;
    const height = ((visibleEndMinutes - visibleStartMinutes) / 60) * HOUR_HEIGHT;
    
    // Log pour déboggage
    if (startMinutes < baseMinutes || endMinutes > END_HOUR * 60) {
      console.log(`Cours partiellement hors grille: ${event.startTime}-${event.endTime}`, event);
    }
    
    return { top, height: Math.max(height, 60) }; // Hauteur minimum 60px
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
              {dayEvents.length} cours programmé{dayEvents.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Layout principal: Timeline (70%) + Liste (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Timeline - 7/10 de l'espace */}
        <div className="lg:col-span-7">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  Planning de la journée
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex">
                {/* Colonne des heures */}
                <div className="flex-shrink-0 w-14 pr-2">
                  {timeSlots.map((time) => (
                    <div key={time} className="h-20 flex items-start justify-end">
                      <span className="text-xs text-muted-foreground font-medium">{time}</span>
                    </div>
                  ))}
                </div>
                
                {/* Zone des cours */}
                <div className="flex-1 relative border-l border-border/30">
                  {/* Lignes de grille horizontales */}
                  {timeSlots.map((time) => (
                    <div 
                      key={time} 
                      className="h-20 border-b border-border/10"
                      style={{ position: 'relative' }}
                    />
                  ))}
                  
                  {/* Événements positionnés absolument avec gestion des chevauchements */}
                  {dayEvents.map((event) => {
                    const { top, height } = getEventPosition(event);
                    const duration = formatDuration(event);
                    const isAutonomie = event.sessionType === 'autonomie';
                    
                    // Récupérer les infos de chevauchement
                    const overlapInfo = overlapMap.get(event.id);
                    const column = overlapInfo?.column ?? 0;
                    const totalColumns = overlapInfo?.totalColumns ?? 1;
                    
                    // Calculer la largeur et la position en fonction des chevauchements
                    const widthPercent = 100 / totalColumns;
                    const leftPercent = (column * 100) / totalColumns;
                    
                    return (
                      <div
                        key={event.id}
                        className="absolute rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden hover:scale-[1.02]"
                        style={{ 
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `calc(${leftPercent}% + 8px)`,
                          width: `calc(${widthPercent}% - ${totalColumns > 1 ? '12px' : '16px'})`,
                          backgroundColor: event.color || '#3B82F6',
                          minHeight: '60px',
                          zIndex: 10
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className="h-full p-3 flex flex-col text-white">
                          <h4 className="font-bold text-sm leading-tight mb-1">
                            {isAutonomie ? 'AUTONOMIE' : event.title}
                          </h4>
                          
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center text-white/90">
                              <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span>
                                {event.startTime.split(':').slice(0, 2).join(':')} - {event.endTime.split(':').slice(0, 2).join(':')}
                              </span>
                            </div>
                            
                            {!isAutonomie && event.room && (
                              <div className="flex items-center text-white/90">
                                <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{event.room}</span>
                              </div>
                            )}
                            
                            {!isAutonomie && event.instructor && (
                              <div className="flex items-center text-white/90">
                                <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                <span className="truncate">{event.instructor}</span>
                              </div>
                            )}

                            {isAutonomie && event.description && (
                              <p className="text-white/80 italic truncate">{event.description}</p>
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

        {/* Liste des cours - 3/10 de l'espace */}
        <div className="lg:col-span-3">
          <Card className="shadow-sm border-border/50 sticky top-6">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center space-x-2">
                <Book className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-foreground">
                  Liste des cours
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {dayEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  Aucun cours programmé
                </p>
              ) : (
                dayEvents.map((event, index) => {
                  const isAutonomie = event.sessionType === 'autonomie';
                  return (
                    <Card 
                      key={event.id}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
                      style={{ borderLeftColor: event.color || '#3B82F6' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-bold text-sm text-foreground leading-tight">
                            {isAutonomie ? 'AUTONOMIE' : event.title}
                          </h5>
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
                            style={{ backgroundColor: event.color || '#3B82F6' }}
                          >
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                            <span>{event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)}</span>
                          </div>
                          {!isAutonomie && event.room && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{event.room}</span>
                            </div>
                          )}
                          {!isAutonomie && event.instructor && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{event.instructor}</span>
                            </div>
                          )}
                          {isAutonomie && event.description && (
                            <p className="text-xs text-muted-foreground italic truncate">{event.description}</p>
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