import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Plus, Edit, Copy, Trash2, GripVertical } from 'lucide-react';
import { ScheduleSlot } from '@/services/scheduleService';
import SlotActionMenu from './SlotActionMenu';

interface ScheduleDay {
  id: string;
  day: string;
  date: string;
  dateObj: Date;
  modules: Array<{
    id: string;
    title: string;
    time: string;
    instructor: string;
    room: string;
    color: string;
    formation?: string;
    slot: ScheduleSlot;
    sessionType?: string;
    notes?: string;
  }>;
}

interface ScheduleManagementCalendarProps {
  schedule: ScheduleDay[];
  filteredSlots: ScheduleSlot[];
  onSlotClick?: (slot: ScheduleSlot) => void;
  onAddSlotToDate: (date: Date) => void;
  onEditSlot: (slot: ScheduleSlot) => void;
  onDuplicateSlot: (slot: ScheduleSlot) => void;
  onDeleteSlot: (slot: ScheduleSlot) => void;
  onDragStart?: (e: React.DragEvent, slot: ScheduleSlot) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, date: Date) => void;
  isEditMode?: boolean;
}

export const ScheduleManagementCalendar: React.FC<ScheduleManagementCalendarProps> = ({
  schedule,
  filteredSlots,
  onSlotClick,
  onAddSlotToDate,
  onEditSlot,
  onDuplicateSlot,
  onDeleteSlot,
  onDragStart,
  onDragOver,
  onDrop,
  isEditMode = false
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
                : 'bg-muted/30 shadow-sm'
            } ${isEditMode ? 'border-dashed border-2 border-primary/30' : ''}`}
            onDragOver={isEditMode ? onDragOver : undefined}
            onDrop={isEditMode && onDrop ? (e) => onDrop(e, day.dateObj) : undefined}
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
                {isEditMode && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onAddSlotToDate(day.dateObj)}
                    className="p-2 h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    title="Ajouter un créneau"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {day.modules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm mb-3">
                    Aucun cours
                  </p>
                  {isEditMode && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onAddSlotToDate(day.dateObj)}
                      className="text-primary hover:bg-primary/10 transition-all duration-300"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>
              ) : (
                day.modules.map((module, index) => {
                  const isAutonomie = module.sessionType === 'autonomie' || module.slot?.session_type === 'autonomie';
                  
                  return (
                    <div
                      key={module.id}
                      draggable={isEditMode && onDragStart ? true : false}
                      onDragStart={isEditMode && onDragStart ? (e) => onDragStart(e, module.slot) : undefined}
                      className={`relative p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 group ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                      style={{ 
                        backgroundColor: module.color || '#6B7280',
                        backgroundImage: `linear-gradient(135deg, ${module.color || '#6B7280'}, ${module.color ? module.color + '90' : '#6B7280BB'})`,
                        color: 'white'
                      }}
                      onClick={() => onSlotClick?.(module.slot)}
                    >
                      {/* Drag handle indicator */}
                      {isEditMode && (
                        <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-white/70" />
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 pr-6">
                          <h4 className="font-semibold text-white text-sm mb-1">
                            {module.title}
                          </h4>
                          {!isAutonomie && module.formation && (
                            <Badge 
                              variant="outline" 
                              className="text-xs mb-2 border-white/30 text-white/90 bg-white/10"
                            >
                              {module.formation}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Menu d'actions pour chaque slot */}
                        {isEditMode && (
                          <SlotActionMenu
                            slot={module.slot}
                            onEdit={onEditSlot}
                            onDuplicate={onDuplicateSlot}
                            onDelete={onDeleteSlot}
                          />
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {/* Autonomie: uniquement le titre + horaire (sans icônes) */}
                        <div className={isAutonomie ? 'text-xs text-white/90' : 'flex items-center text-xs text-white/80'}>
                          {!isAutonomie && <Clock className="h-3 w-3 mr-2" />}
                          {module.time}
                        </div>
                        {!isAutonomie && module.room && (
                          <div className="flex items-center text-xs text-white/80">
                            <MapPin className="h-3 w-3 mr-2" />
                            {module.room}
                          </div>
                        )}
                        {!isAutonomie && module.instructor && (
                          <div className="flex items-center text-xs text-white/80">
                            <User className="h-3 w-3 mr-2" />
                            {module.instructor}
                          </div>
                        )}
                      </div>
                      
                      {isEditMode && (
                        <p className="text-[10px] text-white/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          Glissez pour déplacer
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};