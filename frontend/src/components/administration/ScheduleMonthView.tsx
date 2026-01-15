import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleSlot } from '@/services/scheduleService';
import { formatTimeRange, isAutonomieSession, getSlotModuleTitle } from '@/utils/slotDisplay';

interface ScheduleMonthViewProps {
  selectedDate: Date;
  slots: ScheduleSlot[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onSlotClick?: (slot: ScheduleSlot) => void;
}

export const ScheduleMonthView: React.FC<ScheduleMonthViewProps> = ({
  selectedDate,
  slots,
  onDateSelect,
  onMonthChange,
  onSlotClick
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
  
  const getSlotsForDate = (date: Date) => {
    return slots.filter(slot => isSameDay(new Date(slot.date), date));
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
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {format(selectedDate, 'MMMM yyyy', { locale: fr })}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  Vue mensuelle de l'emploi du temps
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="hover:bg-primary/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="hover:bg-primary/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card className="shadow-xl border-0">
        <CardContent className="p-0">
          {/* Week header */}
          <div className="grid grid-cols-7 border-b bg-muted/30">
            {weekDays.map(day => (
              <div key={day} className="p-4 text-center font-semibold text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar body */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const daySlots = getSlotsForDate(date);
              const isCurrentMonth = isSameMonth(date, selectedDate);
              const isTodayDate = isToday(date);
              const isSelected = isSameDay(date, selectedDate);
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-32 border-r border-b last:border-r-0 p-2 cursor-pointer transition-all duration-200 hover:bg-muted/50
                    ${!isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''}
                    ${isTodayDate ? 'bg-primary/5 border-primary/30' : ''}
                    ${isSelected ? 'bg-primary/10 border-primary' : ''}
                  `}
                  onClick={() => onDateSelect(date)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`
                      text-sm font-medium
                      ${isTodayDate ? 'text-primary font-bold' : ''}
                      ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                    `}>
                      {format(date, 'd')}
                    </span>
                    
                    {isTodayDate && (
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {daySlots.slice(0, 3).map((slot, slotIndex) => {
                      return (
                        <div
                          key={slotIndex}
                          className="text-xs p-2 rounded shadow-sm cursor-pointer hover:shadow-md transition-all"
                          style={{
                            backgroundColor: slot.color || '#6B7280',
                            backgroundImage: `linear-gradient(135deg, ${slot.color || '#6B7280'}, ${slot.color ? slot.color + '90' : '#6B7280BB'})`,
                            color: 'white',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSlotClick?.(slot);
                          }}
                        >
                          <div className="font-medium text-white truncate mb-1">
                            {getSlotModuleTitle(slot)}
                          </div>
                          {/* Autonomie: uniquement le titre + horaire (sans icônes) */}
                          <div className="text-white/85">
                            {formatTimeRange(slot.start_time, slot.end_time)}
                          </div>
                        </div>
                      );
                    })}

                    
                    {daySlots.length > 3 && (
                      <div className="text-xs text-muted-foreground font-medium">
                        +{daySlots.length - 3} autre{daySlots.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};