import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Search, Filter, Bell, TrendingUp } from 'lucide-react';
import { ScheduleSlot } from '@/services/scheduleService';
import { format, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DashboardViewProps {
  schedules: ScheduleSlot[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  schedules, 
  selectedDate, 
  onDateChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const formatTime = (time: string) => time.substring(0, 5);
  
  // Stats calculations
  const todaySchedules = schedules.filter(slot => 
    slot.date === new Date().toISOString().split('T')[0]
  );
  
    const weekSchedules = schedules.filter(slot => {
      const slotDate = new Date(slot.date);
      const today = new Date();
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1);
      const weekEnd = addDays(weekStart, 6);
      return slotDate >= weekStart && slotDate <= weekEnd;
    });

  const nextCourse = schedules
    .filter(slot => {
      const slotDate = new Date(slot.date);
      const now = new Date();
      return slotDate >= now || (isSameDay(slotDate, now) && slot.start_time > `${now.getHours()}:${now.getMinutes()}`);
    })
    .sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    })[0];

  // Mini calendar
  const getMiniCalendarDays = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 1) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const hasScheduleOnDate = (date: Date) => {
    return schedules.some(slot => slot.date === date.toISOString().split('T')[0]);
  };

  const filteredSchedules = schedules.filter(slot => {
    const matchesSearch = searchTerm === '' || 
      slot.formation_modules?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'today' && slot.date === new Date().toISOString().split('T')[0]) ||
      (selectedFilter === 'week' && weekSchedules.includes(slot));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/10">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-card/50 backdrop-blur-xl border-r border-border/50 p-6 overflow-y-auto">
          {/* Search */}
          <div className="search-bar rounded-xl p-3 mb-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent placeholder:text-muted-foreground focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Filtres</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'Tout', icon: Calendar },
                { value: 'today', label: "Aujourd'hui", icon: Clock },
                { value: 'week', label: 'Cette semaine', icon: TrendingUp }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={selectedFilter === value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedFilter(value)}
                  className="w-full justify-start"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4 mb-6">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-foreground">{todaySchedules.length}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cette semaine</p>
                  <p className="text-2xl font-bold text-foreground">{weekSchedules.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-accent" />
              </div>
            </div>
          </div>

          {/* Next Course */}
          {nextCourse && (
            <div className="glass-card rounded-xl p-4 mb-6 animate-fade-in">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Prochain cours
              </h4>
              <div className="space-y-2">
                <p className="font-medium text-foreground">{nextCourse.formation_modules?.title}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(nextCourse.start_time)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {nextCourse.room || 'Salle A101'}
                </div>
              </div>
            </div>
          )}

          {/* Mini Calendar */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {format(new Date(), 'MMMM yyyy', { locale: fr })}
            </h4>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <div key={index} className="text-center py-1 text-muted-foreground font-medium">
                  {day}
                </div>
              ))}
              {getMiniCalendarDays().map((date, index) => {
                const isToday = isSameDay(date, new Date());
                const isSelected = isSameDay(date, selectedDate);
                const hasSchedule = hasScheduleOnDate(date);
                const isCurrentMonth = date.getMonth() === new Date().getMonth();
                
                return (
                  <button
                    key={index}
                    onClick={() => onDateChange(date)}
                    className={`
                      text-center py-1 text-xs rounded transition-colors relative
                      ${isToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                      ${isSelected && !isToday ? 'bg-accent text-accent-foreground' : ''}
                      ${!isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground'}
                      ${hasSchedule ? 'font-semibold' : ''}
                      hover:bg-muted
                    `}
                  >
                    {date.getDate()}
                    {hasSchedule && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Tableau de Bord</h1>
              <p className="text-muted-foreground">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </p>
            </div>

            {/* Schedule List */}
            <div className="space-y-4">
              {filteredSchedules.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-float" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Aucun cours trouvé</h3>
                  <p className="text-muted-foreground">Essayez de modifier vos filtres de recherche</p>
                </div>
              ) : (
                filteredSchedules.map((slot, index) => {
                  const isAutonomie = slot.session_type === 'autonomie';
                  return (
                    <div 
                      key={slot.id}
                      className="floating-card rounded-xl p-6 animate-fade-in shadow-lg"
                      style={{ 
                        animationDelay: `${index * 0.1}s`,
                        backgroundColor: slot.color || '#8B5CF6',
                        backgroundImage: `linear-gradient(135deg, ${slot.color || '#8B5CF6'}, ${slot.color ? slot.color + '90' : '#8B5CF6BB'})`,
                        color: 'white'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {isAutonomie ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini')}
                            </h3>
                          </div>
                          
                          {!isAutonomie && (
                            <p className="text-white/80 text-sm mb-4">
                              Formation
                            </p>
                          )}

                          <div className={`grid grid-cols-1 ${isAutonomie ? '' : 'md:grid-cols-3'} gap-4`}>
                            <div className="flex items-center text-sm text-white/90">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                            </div>
                            
                            {!isAutonomie && (
                              <>
                                <div className="flex items-center text-sm text-white/90">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  <span>{slot.room || 'Salle A101'}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-white/90">
                                  <User className="h-4 w-4 mr-2" />
                                  <span>
                                    {slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Formateur'}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          {slot.notes && (
                            <div className="mt-4 p-3 bg-white/10 rounded-lg">
                              <p className="text-sm text-white/90">{slot.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">
                            {format(new Date(slot.date), 'dd MMM', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};