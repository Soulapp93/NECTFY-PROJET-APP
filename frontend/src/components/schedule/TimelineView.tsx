import React from 'react';
import { Clock, MapPin, User, Book } from 'lucide-react';
import { ScheduleSlot } from '@/services/scheduleService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineViewProps {
  schedules: ScheduleSlot[];
  selectedDate: Date;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ schedules, selectedDate }) => {
  const formatTime = (time: string) => time.substring(0, 5);
  
  const daySchedules = schedules
    .filter(slot => slot.date === selectedDate.toISOString().split('T')[0])
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const firstSlot = daySchedules[0];
    if (!firstSlot || currentTime < firstSlot.start_time || currentTime > daySchedules[daySchedules.length - 1].end_time) {
      return null;
    }
    const startHour = parseInt(firstSlot.start_time.split(':')[0]);
    const currentHour = parseInt(currentTime.split(':')[0]);
    const currentMinutes = parseInt(currentTime.split(':')[1]);
    return ((currentHour - startHour) * 60 + currentMinutes) / 60 * 100;
  };

  const timelinePosition = getCurrentTimePosition();

  return (
    <div className="relative min-h-screen nect-gradient p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with glassmorphism */}
        <div className="glass-card rounded-2xl p-6 mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-white mb-2">Timeline Interactive</h2>
          <p className="text-white/80">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {daySchedules.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
            <Clock className="h-16 w-16 text-white/50 mx-auto mb-4 animate-float" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun cours aujourd'hui</h3>
            <p className="text-white/70">Profitez de cette journée libre !</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-white/30 to-white/10 rounded-full"></div>
            
            {/* Current time indicator */}
            {timelinePosition && (
              <div 
                className="absolute left-4 w-9 h-9 timeline-dot rounded-full border-4 border-white pulse-dot z-10"
                style={{ top: `${timelinePosition}px` }}
              >
                <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-white"></div>
              </div>
            )}

            {/* Timeline items */}
            <div className="space-y-6">
              {daySchedules.map((slot, index) => {
                const isAutonomie = slot.session_type === 'autonomie';
                return (
                  <div 
                    key={slot.id} 
                    className="relative ml-16 animate-fade-in floating-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-12 top-6 w-6 h-6 timeline-dot rounded-full border-4 border-white"></div>
                    
                    {/* Course card */}
                    <div className="course-card rounded-2xl p-6 morphing-card">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {isAutonomie ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini')}
                          </h3>
                          {!isAutonomie && (
                            <p className="text-white/70 text-sm">
                              Formation
                            </p>
                          )}
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full animate-pulse-glow"
                          style={{ backgroundColor: slot.color || '#8B5CF6' }}
                        ></div>
                      </div>

                      <div className={`grid grid-cols-1 ${isAutonomie ? '' : 'md:grid-cols-3'} gap-4 mb-4`}>
                        <div className="flex items-center text-white/80">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                        </div>
                        
                        {!isAutonomie && (
                          <>
                            <div className="flex items-center text-white/80">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span className="text-sm">{slot.room || 'Salle A101'}</span>
                            </div>
                            
                            <div className="flex items-center text-white/80">
                              <User className="h-4 w-4 mr-2" />
                              <span className="text-sm">
                                {slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {!isAutonomie && (
                        <div className="flex items-start text-white/70">
                          <Book className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">Module de formation</p>
                        </div>
                      )}

                      {slot.notes && (
                        <div className="mt-4 p-3 bg-white/10 rounded-lg">
                          <p className="text-white/80 text-sm">{slot.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};