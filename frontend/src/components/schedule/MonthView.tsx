import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleEvent } from './CreateEventModal';

interface MonthViewProps {
  selectedDate: Date;
  events: ScheduleEvent[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onEventClick?: (event: ScheduleEvent) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  selectedDate,
  events,
  onDateSelect,
  onMonthChange,
  onEventClick
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  // Créer un calendrier avec les jours de la semaine précédente/suivante
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay() + 1); // Commencer le lundi
  
  const calendarEnd = new Date(monthEnd);
  const daysToAdd = 7 - calendarEnd.getDay();
  if (daysToAdd < 7) {
    calendarEnd.setDate(calendarEnd.getDate() + daysToAdd);
  }

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    onMonthChange(newDate);
  };

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-8 border-0 shadow-xl overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-3xl nect-gradient flex items-center justify-center shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                <Calendar className="h-7 w-7 text-white relative z-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {format(selectedDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  {events.length} cours ce mois-ci
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Badge 
                variant="secondary" 
                className="text-base px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 text-primary font-semibold rounded-full"
              >
                Vue mensuelle
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Calendrier */}
      <Card className="border-0 shadow-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-card to-muted/10">
        <CardContent className="p-0">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 border-b border-border bg-gradient-to-r from-primary/5 via-muted/50 to-accent/5">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-4 text-center font-bold text-primary/80 backdrop-blur-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Jours du calendrier */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = isSameMonth(date, selectedDate);
              const isSelected = isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[130px] border-r border-b border-border/50 last:border-r-0 cursor-pointer transition-all duration-300 hover:bg-muted/30 ${
                    !isCurrentMonth ? 'bg-muted/20 opacity-60' : 'bg-background hover:shadow-lg'
                  } ${isSelected ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''}`}
                  onClick={() => onDateSelect(date)}
                >
                  <div className="p-2 h-full flex flex-col">
                    {/* Numéro du jour */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-sm font-bold ${
                          !isCurrentMonth 
                            ? 'text-muted-foreground' 
                            : isTodayDate 
                              ? 'nect-gradient text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg'
                              : 'text-foreground'
                        }`}
                      >
                        {format(date, 'd')}
                      </span>
                      
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 nect-gradient text-white rounded-full shadow-sm font-semibold">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>

                    {/* Événements */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                       {dayEvents.slice(0, 3).map((event, index) => {
                         const isAutonomie = event.sessionType === 'autonomie';
                         return (
                           <div
                            key={event.id}
                            className="px-2 py-2 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 mb-1 text-white"
                            style={{ 
                              backgroundColor: event.color || '#3B82F6'
                            }}
                           title={`${isAutonomie ? 'AUTONOMIE' : event.title} - ${event.startTime.substring(0, 5)}`}
                           onClick={(e) => {
                             e.stopPropagation();
                             onEventClick?.(event);
                           }}
                         >
                           <div className="space-y-0.5">
                              <div className="font-bold text-white text-[11px] leading-tight">
                                {isAutonomie ? 'AUTONOMIE' : event.title}
                              </div>
                              
                               <div className="flex items-center text-[9px] text-white/90">
                                 <Clock className="h-2.5 w-2.5 mr-1 text-white/80" />
                                 <span>{event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)}</span>
                               </div>
                              
                              {!isAutonomie && event.room && (
                                <div className="flex items-center text-[9px] text-white/90">
                                  <MapPin className="h-2.5 w-2.5 mr-1 text-white/80" />
                                  <span>{event.room}</span>
                                </div>
                              )}
                              
                              {!isAutonomie && event.instructor && (
                                <div className="flex items-center text-[9px] text-white/90">
                                  <User className="h-2.5 w-2.5 mr-1 text-white/80" />
                                  <span>{event.instructor}</span>
                                </div>
                              )}
                           </div>
                        </div>
                         );
                       })}
                      
                       {dayEvents.length > 3 && (
                         <div className="text-xs text-muted-foreground text-center py-2 font-medium opacity-75">
                           +{dayEvents.length - 3} autres
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card className="mt-8 border-0 shadow-xl glass-card rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 nect-gradient rounded-full shadow-md"></div>
                <span className="font-medium">Aujourd'hui</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-primary rounded-full"></div>
                <span className="font-medium">Jour sélectionné</span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-medium">Cliquez sur un jour pour voir les détails ✨</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};