import React, { useState } from 'react';
import { Clock, MapPin, User, Calendar } from 'lucide-react';
import { ScheduleSlot } from '@/services/scheduleService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KanbanViewProps {
  schedules: ScheduleSlot[];
  selectedDate: Date;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ schedules, selectedDate }) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const formatTime = (time: string) => time.substring(0, 5);
  
  const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  const getWeekDates = () => {
    const monday = new Date(selectedDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    
    return weekDays.map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules
      .filter(slot => slot.date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div className="min-h-screen nect-gradient p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-white mb-2">Vue Kanban</h2>
          <p className="text-white/80">Organisez votre semaine par colonnes</p>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 auto-rows-max">
          {getWeekDates().map((date, index) => {
            const daySlots = getSlotsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={index}
                className={`kanban-column rounded-2xl p-4 animate-fade-in ${isToday ? 'ring-2 ring-white/30' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Column Header */}
                <div className="mb-4 text-center">
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {weekDays[index]}
                  </h3>
                  <div className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-white/80'}`}>
                    {date.getDate()}
                  </div>
                  <div className="text-white/60 text-xs">
                    {format(date, 'MMM', { locale: fr })}
                  </div>
                  {isToday && (
                    <div className="mt-1">
                      <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse-glow"></span>
                    </div>
                  )}
                </div>

                {/* Course Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {daySlots.length === 0 ? (
                    <div className="rounded-xl p-4 text-center opacity-50 bg-white/5 backdrop-blur-sm border border-white/10">
                      <Calendar className="h-8 w-8 text-white/30 mx-auto mb-2" />
                      <p className="text-white/50 text-xs">Libre</p>
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const isAutonomie = slot.session_type === 'autonomie';
                      return (
                        <div
                          key={slot.id}
                          className={`rounded-xl p-4 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                            expandedCard === slot.id ? 'scale-105 shadow-2xl' : ''
                          }`}
                          style={{ 
                            backgroundColor: slot.color || '#E879F9',
                            color: 'white',
                            border: 'none',
                            backgroundImage: `linear-gradient(135deg, ${slot.color || '#E879F9'}, ${slot.color ? slot.color + '90' : '#E879F9BB'})`
                          }}
                          onClick={() => setExpandedCard(expandedCard === slot.id ? null : slot.id)}
                        >

                          {/* Course title */}
                          <h4 className="text-white font-bold text-sm mb-2 line-clamp-2">
                            {isAutonomie ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini')}
                          </h4>

                          {/* Time */}
                          <div className="flex items-center text-white/70 text-xs mb-2">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                          </div>

                          {/* Expanded details */}
                          {expandedCard === slot.id && (
                            <div className="mt-3 pt-3 border-t border-white/20 animate-fade-in">
                              <div className="space-y-2">
                                {!isAutonomie && (
                                  <>
                                    <div className="flex items-center text-white/70 text-xs">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span>{slot.room || 'Salle A101'}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-white/70 text-xs">
                                      <User className="h-3 w-3 mr-1" />
                                      <span>
                                        {slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}
                                      </span>
                                    </div>
                                  </>
                                )}

                                {slot.notes && (
                                  <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/80">
                                    {slot.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Minimized indicators */}
                          {expandedCard !== slot.id && !isAutonomie && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                                <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                              </div>
                              <div className="text-white/50 text-xs">
                                {slot.room?.slice(0, 4) || 'Salle'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};