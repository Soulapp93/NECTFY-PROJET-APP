import React, { useState } from 'react';
import { Clock, MapPin, User, Calendar, Book, Maximize2, Minimize2 } from 'lucide-react';
import { ScheduleSlot } from '@/services/scheduleService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MasonryViewProps {
  schedules: ScheduleSlot[];
  selectedDate: Date;
}

export const MasonryView: React.FC<MasonryViewProps> = ({ schedules, selectedDate }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  const formatTime = (time: string) => time.substring(0, 5);
  
  const getWeekDates = () => {
    const monday = new Date(selectedDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDays.push(date);
    }
    return weekDays;
  };

  const getAllWeekSchedules = () => {
    const weekDates = getWeekDates();
    return schedules
      .filter(slot => {
        const slotDate = new Date(slot.date);
        return weekDates.some(date => 
          date.toISOString().split('T')[0] === slot.date
        );
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });
  };

  const toggleExpanded = (slotId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(slotId)) {
      newExpanded.delete(slotId);
    } else {
      newExpanded.add(slotId);
    }
    setExpandedCards(newExpanded);
  };

  const getCardHeight = (slot: ScheduleSlot, isExpanded: boolean) => {
    const startHour = parseInt(slot.start_time.split(':')[0]);
    const endHour = parseInt(slot.end_time.split(':')[0]);
    const duration = endHour - startHour;
    
    if (isExpanded) {
      return Math.max(200, duration * 80 + 120);
    }
    return Math.max(120, duration * 40 + 80);
  };

  const allSchedules = getAllWeekSchedules();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Vue Mosaïque</h2>
              <p className="text-muted-foreground">
                Semaine du {format(getWeekDates()[0], 'd', { locale: fr })} au {format(getWeekDates()[6], 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-primary animate-float" />
          </div>
        </div>

        {allSchedules.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-float" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun cours cette semaine</h3>
            <p className="text-muted-foreground">Profitez de cette semaine libre !</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {allSchedules.map((slot, index) => {
              const isExpanded = expandedCards.has(slot.id);
              const slotDate = new Date(slot.date);
              const dayName = format(slotDate, 'EEEE', { locale: fr });
              const isToday = slotDate.toDateString() === new Date().toDateString();
              const isAutonomie = slot.session_type === 'autonomie';
              
              return (
                <div 
                  key={slot.id}
                  className="break-inside-avoid mb-6 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div 
                    className={`morphing-card glass-card rounded-2xl p-6 cursor-pointer transition-all duration-500 ${
                      isToday ? 'ring-2 ring-primary/50' : ''
                    }`}
                    style={{ height: `${getCardHeight(slot, isExpanded)}px` }}
                    onClick={() => toggleExpanded(slot.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div 
                            className="w-3 h-3 rounded-full mr-2 animate-pulse-glow"
                            style={{ backgroundColor: slot.color || '#8B5CF6' }}
                          ></div>
                          <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                            {dayName} {slotDate.getDate()}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground leading-tight">
                          {isAutonomie ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini')}
                        </h3>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Time badge */}
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4"
                         style={{ 
                           backgroundColor: `${slot.color || '#8B5CF6'}20`,
                           color: slot.color || '#8B5CF6'
                         }}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>

                    {/* Basic info - masqué pour autonomie */}
                    {!isAutonomie && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>{slot.room || 'Salle A101'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Notes pour autonomie */}
                    {isAutonomie && slot.notes && (
                      <div className="mb-4 text-sm text-muted-foreground italic">
                        {slot.notes}
                      </div>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Formation info - masqué pour autonomie */}
                        {!isAutonomie && (
                          <>
                            <div className="p-3 bg-muted/20 rounded-lg">
                              <p className="text-sm font-medium text-foreground mb-1">Formation</p>
                              <p className="text-sm text-muted-foreground">Module de formation</p>
                            </div>

                            <div className="flex items-start">
                              <Book className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                Module de formation avancé
                              </p>
                            </div>
                          </>
                        )}

                        {/* Notes */}
                        {slot.notes && !isAutonomie && (
                          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                            <p className="text-sm text-foreground">{slot.notes}</p>
                          </div>
                        )}

                        {/* Duration indicator */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Durée: {parseInt(slot.end_time.split(':')[0]) - parseInt(slot.start_time.split(':')[0])}h</span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-primary/30"></div>
                            <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Minimized footer - masqué pour autonomie */}
                    {!isExpanded && !isAutonomie && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Formation</span>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                          <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};