import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Plus } from 'lucide-react';
import { ScheduleEvent } from './CreateEventModal';

interface ScheduleDay {
  id: string;
  day: string;
  date: string;
  modules: Array<{
    title: string;
    time: string;
    instructor: string;
    room: string;
    color: string;
  }>;
}

interface ScheduleCalendarViewProps {
  schedule: ScheduleDay[];
  filteredEvents: ScheduleEvent[];
  onEventClick: (event: ScheduleEvent) => void;
  onAddSlotToDate: (date: string) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  schedule,
  filteredEvents,
  onEventClick,
  onAddSlotToDate
}) => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {schedule.map((day) => (
          <Card
            key={day.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${
              day.modules.length > 0 
                ? 'bg-card shadow-md hover:shadow-primary/10' 
                : 'bg-muted/30 shadow-sm opacity-70'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {day.day}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-bold text-primary">
                      {day.date}
                    </span>
                    {day.modules.length > 0 && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {day.modules.length} cours
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Bouton Ajouter sur chaque colonne de date */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onAddSlotToDate(day.date)}
                  className="p-2 h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
                  title="Ajouter un créneau"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {day.modules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Aucun cours
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onAddSlotToDate(day.date)}
                    className="mt-2 text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              ) : (
                day.modules.map((module, index) => (
                  <div
                    key={index}
                    className="relative p-4 rounded-xl bg-gradient-to-r from-card to-muted/30 border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      const fullEvent = filteredEvents.find(e => 
                        e.title === module.title && 
                        e.instructor === module.instructor &&
                        e.room === module.room
                      );
                      if (fullEvent) onEventClick(fullEvent);
                    }}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${module.color} rounded-l-xl`} />
                    
                    <div className="ml-3">
                      <h4 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors">
                        {module.title}
                      </h4>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.time}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {module.room}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <User className="h-3 w-3 mr-1" />
                          {module.instructor}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};