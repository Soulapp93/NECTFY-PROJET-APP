import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Book,
  Grid3X3,
  List,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Edit,
  Trash2,
  Copy,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EventDetailsModal, ScheduleEvent } from '@/components/schedule/EventDetailsModal';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { WeekNavigator } from '@/components/schedule/WeekNavigator';
import WeekNavigation from '@/components/ui/week-navigation';
import { ViewModeSelector } from '@/components/schedule/ViewModeSelector';
import { DayView } from '@/components/schedule/DayView';
import { ScheduleManagementHeader } from './ScheduleManagementHeader';
import { ScheduleManagementCalendar } from './ScheduleManagementCalendar';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useSchedules } from '@/hooks/useSchedules';
import { scheduleService, Schedule, ScheduleSlot } from '@/services/scheduleService';
import AddSlotModal from '@/components/administration/AddSlotModal';
import EditSlotModal from '@/components/administration/EditSlotModal';
import SlotActionMenu from '@/components/administration/SlotActionMenu';
import ExcelImportModal from '@/components/administration/ExcelImportModal';
import CreateScheduleModal from './CreateScheduleModal';
import { getModuleColor, extractModuleName } from '@/utils/moduleColors';
import { navigateWeek, getWeekInfo, getWeekDays } from '@/utils/calendarUtils';
import { formatTimeRange, isAutonomieSlot, getSlotModuleTitle, getSlotInstructorName } from '@/utils/slotDisplay';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'day' | 'week' | 'month' | 'list';

const ScheduleManagement = () => {
  const { schedules, loading, refetch } = useSchedules();
  const navigate = useNavigate();
  
  // États principaux
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [scheduleListViewMode, setScheduleListViewMode] = useState<'grid' | 'list'>('grid');
  const [isWeekNavigationOpen, setIsWeekNavigationOpen] = useState(true);
  
  // États pour les modales
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [isEditSlotModalOpen, setIsEditSlotModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [slotToEdit, setSlotToEdit] = useState<ScheduleSlot | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<ScheduleSlot | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [detailsEvent, setDetailsEvent] = useState<ScheduleEvent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Handlers pour les boutons principaux - Simplifiés
  const handleOpenAddSlotModal = useCallback(() => {
    if (!selectedSchedule?.id) {
      toast.error('Veuillez sélectionner un emploi du temps pour ajouter des créneaux');
      return;
    }
    setSelectedSlot(null);
    setTimeout(() => setIsAddSlotModalOpen(true), 0);
  }, [selectedSchedule?.id]);

  const handleOpenExcelImportModal = useCallback(() => {
    console.log('Ouverture modale Import Excel', { selectedSchedule: selectedSchedule?.id });
    if (!selectedSchedule?.id) {
      toast.error('Veuillez sélectionner un emploi du temps pour importer des données');
      return;
    }
    setIsExcelImportModalOpen(true);
  }, [selectedSchedule?.id]);

  // Fonction pour convertir ScheduleSlot en ScheduleEvent pour le modal de détails
  const convertSlotToEvent = useCallback((slot: ScheduleSlot): ScheduleEvent => {
    return {
      id: slot.id,
      title: slot.formation_modules?.title || 'Module non défini',
      date: new Date(slot.date),
      startTime: slot.start_time,
      endTime: slot.end_time,
      instructor: slot.users?.first_name && slot.users?.last_name 
        ? `${slot.users.first_name} ${slot.users.last_name}`
        : 'Non assigné',
      room: slot.room || 'Non définie',
      formation: selectedSchedule?.formations?.title || '',
      color: slot.color || 'hsl(var(--primary))',
      description: slot.notes || undefined
    };
  }, [selectedSchedule]);

  // Handler pour ouvrir le modal de détails
  const handleSlotClick = useCallback((slot: ScheduleSlot) => {
    const event = convertSlotToEvent(slot);
    setDetailsEvent(event);
    setIsDetailsModalOpen(true);
  }, [convertSlotToEvent]);

  const handleAddSlot = useCallback((date: Date, time: string) => {
    if (!selectedSchedule?.id) {
      toast.error('Veuillez sélectionner un emploi du temps');
      return;
    }
    const newSlot = {
      date: formatDate(date),
      time
    };
    setSelectedSlot(newSlot);
    setTimeout(() => setIsAddSlotModalOpen(true), 0);
  }, [selectedSchedule?.id]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };



  // Calculer les valeurs memoized
  const weekInfo = useMemo(() => getWeekInfo(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Fonction pour récupérer les créneaux
  const fetchScheduleSlots = useCallback(async () => {
    if (!selectedSchedule?.id) {
      setSlots([]);
      return;
    }
    
    try {
      setSlotsLoading(true);
      const slotsData = await scheduleService.getScheduleSlots(selectedSchedule.id);
      setSlots(slotsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      toast.error('Erreur lors du chargement des créneaux');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedSchedule?.id]);

  // Charger les créneaux quand un emploi du temps est sélectionné
  useEffect(() => {
    fetchScheduleSlots();
  }, [fetchScheduleSlots]);

  const handleCreateSchedule = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
    toast.success('Emploi du temps créé avec succès');
  };

  const handleDeleteSchedule = async (scheduleId: string, title: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'emploi du temps "${title}" ?`)) {
      try {
        await scheduleService.deleteSchedule(scheduleId);
        toast.success('Emploi du temps supprimé avec succès');
        refetch();
        if (selectedSchedule?.id === scheduleId) {
          setSelectedSchedule(null);
          setViewMode('list');
        }
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'emploi du temps');
      }
    }
  };

  const handleEditSchedule = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsEditMode(true);
      setViewMode('week');
    }
  };

  const handleViewSchedule = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsEditMode(false);
      setViewMode('week');
    }
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    if (selectedSchedule?.id) {
      setSlotToEdit(slot);
      setIsEditSlotModalOpen(true);
    } else {
      toast.error('Erreur: Aucun emploi du temps sélectionné');
    }
  };

  const handleSlotAdded = () => {
    fetchScheduleSlots();
    setIsAddSlotModalOpen(false);
    setSelectedSlot(null);
    toast.success('Créneau ajouté avec succès');
  };

  const handleSlotEdited = () => {
    fetchScheduleSlots();
    setIsEditSlotModalOpen(false);
    setSlotToEdit(null);
    toast.success('Créneau modifié avec succès');
  };

  const handleDuplicateSlot = async (slot: ScheduleSlot) => {
    try {
      const duplicatedSlot = {
        schedule_id: slot.schedule_id,
        module_id: slot.module_id,
        instructor_id: slot.instructor_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        room: slot.room ? `${slot.room} (copie)` : 'Salle (copie)',
        color: slot.color,
        notes: slot.notes
      };
      
      await scheduleService.createScheduleSlot(duplicatedSlot);
      fetchScheduleSlots();
      toast.success('Créneau dupliqué avec succès');
    } catch (error) {
      toast.error('Erreur lors de la duplication du créneau');
    }
  };

  const handleDeleteSlot = async (slot: ScheduleSlot) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      try {
        await scheduleService.deleteScheduleSlot(slot.id);
        fetchScheduleSlots();
        toast.success('Créneau supprimé avec succès');
      } catch (error) {
        toast.error('Erreur lors de la suppression du créneau');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, slot: ScheduleSlot) => {
    setDraggedSlot(slot);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot.id);
    // Add visual effect to dragged element
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedSlot(null);
    setDragOverDay(null);
  };

  const handleDragOver = (e: React.DragEvent, dateStr?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dateStr && dateStr !== dragOverDay) {
      setDragOverDay(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if leaving the drop zone completely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverDay(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (!draggedSlot) return;
    
    try {
      const newDate = formatDate(targetDate);
      if (newDate !== draggedSlot.date) {
        // Optimistic update - update local state immediately
        setSlots(prevSlots => 
          prevSlots.map(s => 
            s.id === draggedSlot.id ? { ...s, date: newDate } : s
          )
        );
        
        await scheduleService.updateScheduleSlot(draggedSlot.id, {
          date: newDate
        });
        toast.success('Créneau déplacé avec succès');
      }
    } catch (error) {
      // Revert on error
      fetchScheduleSlots();
      toast.error('Erreur lors du déplacement du créneau');
    } finally {
      setDraggedSlot(null);
    }
  };

  const handlePublishSchedule = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedSchedule) {
      toast.error('Aucun emploi du temps sélectionné');
      return;
    }
    
    console.log('Bouton "Publier" cliqué', { selectedSchedule: selectedSchedule.id });
    
    try {
      await scheduleService.updateSchedule(selectedSchedule.id, { updated_at: new Date().toISOString() });
      toast.success("Emploi du temps publié avec succès");
      refetch();
    } catch (error) {
      console.error('Erreur publication:', error);
      toast.error("Erreur lors de la publication");
    }
  };

  const handleSaveModifications = async () => {
    if (!selectedSchedule) {
      toast.error('Aucun emploi du temps sélectionné');
      return;
    }

    try {
      // Met à jour l'emploi du temps et déclenche les notifications
      await scheduleService.updateSchedule(selectedSchedule.id, { 
        updated_at: new Date().toISOString() 
      });
      
      toast.success("Modifications enregistrées avec succès");
      toast.info("Tous les utilisateurs ont été notifiés");
      
      // Quitter le mode édition après sauvegarde
      setIsEditMode(false);
      refetch();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error("Erreur lors de l'enregistrement des modifications");
    }
  };

  const handleExcelImportSuccess = () => {
    if (selectedSchedule?.id) {
      fetchScheduleSlots();
      setIsExcelImportModalOpen(false);
      toast.success('Import Excel terminé avec succès');
    }
  };

  // Navigation handlers
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (viewMode === 'month') {
      if (direction === 'prev') setSelectedDate(subMonths(selectedDate, 1));
      else if (direction === 'next') setSelectedDate(addMonths(selectedDate, 1));
      else setSelectedDate(new Date());
    } else if (viewMode === 'day') {
      if (direction === 'prev') {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
      } else if (direction === 'next') {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
      } else {
        setSelectedDate(new Date());
      }
    } else {
      setSelectedDate(navigateWeek(selectedDate, direction));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement des emplois du temps...</p>
        </div>
      </div>
    );
  }

  // Convert ScheduleSlots to events format for display
  const convertSlotsToEvents = (slots: ScheduleSlot[]) => {
    return slots.map(slot => ({
      id: slot.id,
      title: slot.formation_modules?.title || 'Module non défini',
      date: new Date(slot.date),
      startTime: slot.start_time,
      endTime: slot.end_time,
      instructor: slot.users?.first_name && slot.users?.last_name 
        ? `${slot.users.first_name} ${slot.users.last_name}` 
        : 'Instructeur non défini',
      room: slot.room || 'Salle non définie',
      formation: selectedSchedule?.formations?.title || 'Formation',
      color: slot.notes ? getModuleColor(extractModuleName(slot.notes)) : '#3B82F6',
      description: slot.notes || ''
    }));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        if (direction === 'next') {
          setSelectedDate(addMonths(selectedDate, 1));
          return;
        } else {
          setSelectedDate(subMonths(selectedDate, 1));
          return;
        }
    }
    
    setSelectedDate(newDate);
  };

  const getCurrentPeriodLabel = () => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });
      case 'week':
        return `Semaine du ${weekInfo.start} au ${weekInfo.end}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy', { locale: fr });
      default:
        return '';
    }
  };
  
   // Prepare week schedule data for week and list views
  const mockSchedule = weekDays.map((date, index) => {
    const daySlots = slots.filter(slot => 
      new Date(slot.date).toDateString() === date.toDateString()
    );
    
    const isAutonomie = (slot: ScheduleSlot) => isAutonomieSlot(slot);
    
    return {
      id: (index + 1).toString(),
      day: format(date, 'EEEE', { locale: fr }),
      date: format(date, 'd'),
      actualDate: date, // Ajouter la date réelle pour faciliter l'accès
      modules: daySlots.map(slot => ({
        slotId: slot.id, // Ajouter l'ID du slot pour pouvoir le retrouver facilement
        slot: slot, // Référence directe au slot
        title: isAutonomie(slot) ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini'),
        time: `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`,
        instructor: isAutonomie(slot) ? '' : (slot.users?.first_name && slot.users?.last_name 
          ? `${slot.users.first_name} ${slot.users.last_name}` 
          : 'Instructeur non défini'),
        room: isAutonomie(slot) ? '' : (slot.room || 'Salle non définie'),
        color: slot.color || '#8B5CF6',
        sessionType: slot.session_type,
        notes: slot.notes
      }))
    };
  });

  // Schedule detail view with same interface as main schedule
  if (selectedSchedule && (viewMode === 'day' || viewMode === 'week' || viewMode === 'month' || viewMode === 'list')) {
    const events = convertSlotsToEvents(slots);
    
    // Render current view function
    const renderCurrentView = () => {
      switch (viewMode) {
        case 'day':
          return renderDayView();
        case 'week':
          return renderWeekOrListView();
        case 'month':
          return renderMonthView();
        case 'list':
          return renderWeekOrListView();
        default:
          return renderWeekOrListView();
      }
    };

    const renderDayView = () => {
      // Convertir les slots en événements pour la vue jour
      const daySlots = slots
        .filter(slot => new Date(slot.date).toDateString() === selectedDate.toDateString())
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

       const slotsAsEvents = daySlots.map(slot => {
         const autonomie = isAutonomieSlot(slot);
         return {
           id: slot.id,
           title: autonomie ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini'),
           date: new Date(slot.date),
           startTime: slot.start_time.substring(0, 5),
           endTime: slot.end_time.substring(0, 5),
           instructor: autonomie
             ? ''
             : (slot.users?.first_name && slot.users?.last_name
               ? `${slot.users.first_name} ${slot.users.last_name}`
               : 'Instructeur non défini'),
           room: autonomie ? '' : (slot.room || 'Salle non définie'),
           formation: selectedSchedule?.formations?.title || 'Formation',
           color: slot.color || '#3B82F6',
           description: slot.notes || '',
           sessionType: autonomie ? 'autonomie' : slot.session_type,
         };
       });

      return (
        <DayView
          selectedDate={selectedDate}
          events={slotsAsEvents}
          onEventClick={(event) => {
            const slot = daySlots.find(s => s.id === event.id);
            if (slot) {
              handleEditSlot(slot);
            }
          }}
        />
      );
    };

    const renderMonthView = () => {
      // Convertir les slots en événements pour la vue mensuelle
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
        setSelectedDate(newDate);
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
                      {slots.length} cours ce mois-ci
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
                  const daySlots = getSlotsForDate(date);
                  const isCurrentMonth = isSameMonth(date, selectedDate);
                  const isSelected = isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);

                   const slotsAsEvents = daySlots.map(slot => {
                     const autonomie = isAutonomieSlot(slot);
                     return {
                       id: slot.id,
                       title: autonomie ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini'),
                       startTime: slot.start_time.substring(0, 5),
                       endTime: slot.end_time.substring(0, 5),
                       instructor: autonomie
                         ? ''
                         : (slot.users?.first_name && slot.users?.last_name
                           ? `${slot.users.first_name} ${slot.users.last_name}`
                           : 'Instructeur non défini'),
                       room: autonomie ? '' : (slot.room || 'Salle non définie'),
                       color: slot.color || '#3B82F6',
                       sessionType: autonomie ? 'autonomie' : slot.session_type,
                     };
                   });

                  return (
                    <div
                      key={date.toISOString()}
                      className={`min-h-[130px] border-r border-b border-border/50 last:border-r-0 cursor-pointer transition-all duration-300 hover:bg-muted/30 ${
                        !isCurrentMonth ? 'bg-muted/20 opacity-60' : 'bg-background hover:shadow-lg'
                      } ${isSelected ? 'ring-2 ring-primary shadow-lg bg-primary/5' : ''}`}
                      onClick={() => setSelectedDate(date)}
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
                          
                          {slotsAsEvents.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1 nect-gradient text-white rounded-full shadow-sm font-semibold">
                              {slotsAsEvents.length}
                            </Badge>
                          )}
                        </div>

                        {/* Événements */}
                        <div className="flex-1 space-y-1 overflow-hidden">
                           {slotsAsEvents.slice(0, 3).map((event, index) => {
                             const originalSlot = daySlots.find(s => s.id === event.id);
                             return (
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger asChild>
                                     <div
                                       key={event.id}
                                       className="px-2 py-2 rounded-md shadow-sm cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200 mb-1 text-white"
                                       style={{ 
                                         backgroundColor: event.color
                                       }}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         if (originalSlot) handleSlotClick(originalSlot);
                                       }}
                                     >
                                 <div className="space-y-0.5">
                                   <div className="font-bold text-white text-[11px] leading-tight">
                                     {event.sessionType === 'autonomie' ? 'AUTONOMIE' : event.title}
                                   </div>

                                   <div className="flex items-center text-[9px] text-white/90">
                                     <Clock className="h-2.5 w-2.5 mr-1 text-white/80" />
                                     <span>{formatTimeRange(event.startTime, event.endTime)}</span>
                                   </div>

                                   {event.sessionType !== 'autonomie' && event.room && (
                                     <div className="flex items-center text-[9px] text-white/90">
                                       <MapPin className="h-2.5 w-2.5 mr-1 text-white/80" />
                                       <span>{event.room}</span>
                                     </div>
                                   )}

                                   {event.sessionType !== 'autonomie' && event.instructor && (
                                     <div className="flex items-center text-[9px] text-white/90">
                                       <User className="h-2.5 w-2.5 mr-1 text-white/80" />
                                       <span>{event.instructor}</span>
                                     </div>
                                   )}
                                 </div>
                                     </div>
                                   </TooltipTrigger>
                                   <TooltipContent side="right" className="max-w-xs">
                                      <div className="space-y-1">
                                        <p className="font-semibold">{event.title}</p>
                                        <p className="text-xs">{event.startTime.substring(0, 5)} - {event.endTime.substring(0, 5)}</p>
                                        <p className="text-xs">{event.instructor}</p>
                                        <p className="text-xs">Salle: {event.room}</p>
                                      </div>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                            );
                            })}
                           
                            {slotsAsEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center py-2 font-medium opacity-75">
                                +{slotsAsEvents.length - 3} autres
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

    const renderWeekOrListView = () => {
      if (viewMode === 'list') {
        // Vue liste tabulaire - ALL slots (past and future), sorted chronologically
        const allSlots = [...slots].sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          return a.start_time.localeCompare(b.start_time);
        });

        return (
          <div className="container mx-auto px-6 py-8">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-muted/50 to-accent/10">
                <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Horaire</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Book className="h-4 w-4" />
                    <span>Module</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Formateur</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Salle</span>
                  </div>
                  <div>Actions</div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 p-4">
                  {allSlots.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-muted-foreground mb-2">Aucun créneau</h3>
                      <p className="text-muted-foreground">Commencez par ajouter des créneaux à votre emploi du temps</p>
                    </div>
                  ) : (
                    allSlots.map((slot) => (
                      <TooltipProvider key={slot.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="grid grid-cols-6 gap-4 items-center p-4 rounded-lg cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 text-white"
                              style={{ 
                                backgroundColor: slot.color || '#8B5CF6'
                              }}
                              onClick={() => handleSlotClick(slot)}
                            >
                              {/* Date */}
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {format(new Date(slot.date), 'dd/MM/yyyy', { locale: fr })}
                                </div>
                                <div className="text-xs text-white/80">
                                  {format(new Date(slot.date), 'EEEE', { locale: fr })}
                                </div>
                              </div>

                              {/* Horaire */}
                              <div>
                                <div className="bg-white/20 text-white border-white/30 rounded px-2 py-1 text-xs font-medium inline-block">
                                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                </div>
                              </div>

                              {/* Module */}
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {isAutonomieSlot(slot) ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini')}
                                </div>
                                {slot.notes && (
                                  <div className="text-xs text-white/80 mt-1">
                                    {slot.notes}
                                  </div>
                                )}
                              </div>

                              {/* Formateur */}
                              <div>
                                {isAutonomieSlot(slot) ? (
                                  <span className="text-sm text-white/70"> </span>
                                ) : (
                                  <span className="text-sm text-white">
                                    {slot.users?.first_name && slot.users?.last_name
                                      ? `${slot.users.first_name} ${slot.users.last_name}`
                                      : 'Non assigné'
                                    }
                                  </span>
                                )}
                              </div>

                              {/* Salle */}
                              <div>
                                {isAutonomieSlot(slot) ? (
                                  <span className="text-sm text-white/70"> </span>
                                ) : (
                                  <span className="text-sm text-white">
                                    {slot.room || 'Non définie'}
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              {isEditMode && (
                                <div>
                                  <div className="flex items-center space-x-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSlot(slot);
                                      }}
                                      title="Modifier"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicateSlot(slot);
                                      }}
                                      title="Dupliquer"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-7 w-7 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSlot(slot);
                                      }}
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-semibold">{isAutonomieSlot(slot) ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini')}</p>
                              <p className="text-xs">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</p>
                              {!isAutonomieSlot(slot) && (
                                <>
                                  <p className="text-xs">{slot.users?.first_name} {slot.users?.last_name}</p>
                                  <p className="text-xs">Salle: {slot.room}</p>
                                </>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Vue semaine (grille)
      return (
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
            {mockSchedule.map((day) => {
              const dayDateStr = formatDate(day.actualDate);
              const isDragOver = dragOverDay === dayDateStr && draggedSlot?.date !== dayDateStr;
              
              return (
                <Card
                  key={day.id}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${
                    day.modules.length > 0 
                      ? 'bg-card shadow-md hover:shadow-primary/10' 
                      : 'bg-muted/30 shadow-sm opacity-70'
                  } ${isEditMode ? 'border-dashed border-2 border-primary/30' : ''} ${
                    isDragOver ? 'ring-2 ring-primary bg-primary/10 scale-105' : ''
                  }`}
                  onDragOver={isEditMode ? (e) => handleDragOver(e, dayDateStr) : undefined}
                  onDragLeave={isEditMode ? handleDragLeave : undefined}
                  onDrop={isEditMode ? (e) => handleDrop(e, day.actualDate) : undefined}
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
                      {day.modules.length === 0 && !isDragOver && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {isDragOver && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>
                  </CardHeader>

                <CardContent className="space-y-3">
                  {day.modules.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm mb-2">Aucun cours</p>
                      {isEditMode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddSlot(day.actualDate, '09:00');
                          }}
                          disabled={!selectedSchedule?.id}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {day.modules.map((module, index) => (
                        <TooltipProvider key={module.slotId || index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                draggable={isEditMode}
                                onDragStart={isEditMode ? (e) => handleDragStart(e, module.slot) : undefined}
                                onDragEnd={isEditMode ? handleDragEnd : undefined}
                                className={`relative p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 mb-2 text-white group ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedSlot?.id === module.slotId ? 'opacity-50 ring-2 ring-primary' : ''}`}
                                style={{ 
                                  backgroundColor: module.color || '#8B5CF6'
                                }}
                                onClick={() => module.slot && handleSlotClick(module.slot)}
                              >
                                {/* Drag handle indicator */}
                                {isEditMode && (
                                  <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="h-4 w-4 text-white/70" />
                                  </div>
                                )}
                                
                                <div>
                                  <h4 className="font-semibold text-white text-sm mb-2 pr-6">
                                    {isAutonomieSlot(module.slot) ? 'AUTONOMIE' : module.title}
                                  </h4>

                                  {/* Autonomie: uniquement titre + horaire (sans salle/formateur) */}
                                  {isAutonomieSlot(module.slot) ? (
                                    <div className="flex items-center text-xs text-white/90">
                                      <Clock className="h-3 w-3 mr-1 text-white/80" />
                                      {module.time}
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <div className="flex items-center text-xs text-white/90">
                                        <Clock className="h-3 w-3 mr-1 text-white/80" />
                                        {module.time}
                                      </div>
                                      <div className="flex items-center text-xs text-white/90">
                                        <MapPin className="h-3 w-3 mr-1 text-white/80" />
                                        {module.room}
                                      </div>
                                      <div className="flex items-center text-xs text-white/90">
                                        <User className="h-3 w-3 mr-1 text-white/80" />
                                        {module.instructor}
                                      </div>
                                    </div>
                                  )}

                                  
                                  {/* Admin actions */}
                                  {isEditMode && (
                                    <div className="flex items-center space-x-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (module.slot) handleEditSlot(module.slot);
                                        }}
                                        title="Modifier"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (module.slot) handleDuplicateSlot(module.slot);
                                        }}
                                        title="Dupliquer"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (module.slot) handleDeleteSlot(module.slot);
                                        }}
                                        title="Supprimer"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{isAutonomieSlot(module.slot) ? 'AUTONOMIE' : module.title}</p>
                                <p className="text-xs">{module.time}</p>
                                {!isAutonomieSlot(module.slot) && (
                                  <>
                                    <p className="text-xs">{module.instructor}</p>
                                    <p className="text-xs">Salle: {module.room}</p>
                                  </>
                                )}
                                {isEditMode && (
                                  <p className="text-xs text-muted-foreground mt-2">Glissez pour déplacer</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      {isEditMode && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddSlot(day.actualDate, '09:00');
                          }}
                          disabled={!selectedSchedule?.id}
                          className="w-full text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter un cours
                        </Button>
                      )}
                    </>
                  )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
        {/* Header moderne identique à l'emploi du temps */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedSchedule(null);
                    setIsEditMode(false);
                    setViewMode('list');
                    setIsAddSlotModalOpen(false);
                    setIsEditSlotModalOpen(false);
                    setIsDetailsModalOpen(false);
                  }}
                  className="p-2 hover:bg-primary/10 flex-shrink-0"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground truncate">{selectedSchedule.title}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {`Semaine du ${weekInfo.start} au ${weekInfo.end}`}
                  </p>
                </div>
              </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isEditMode ? (
                <>
                  <Button 
                    onClick={handleOpenAddSlotModal}
                    disabled={!selectedSchedule?.id}
                    variant="premium"
                    size="sm"
                    className="shadow-lg hover:shadow-xl transition-all text-xs"
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Ajouter un créneau</span>
                  </Button>
                  
                  {selectedSchedule && (
                    <Button 
                      onClick={handlePublishSchedule}
                      disabled={slots.length === 0}
                      variant="success"
                      size="sm"
                      className="shadow-lg hover:shadow-xl transition-all text-xs"
                    >
                      <CheckCircle className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Publier</span>
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleOpenExcelImportModal}
                    disabled={!selectedSchedule?.id}
                    variant="elegant"
                    size="sm"
                    className="shadow-md hover:shadow-lg transition-all text-xs"
                  >
                    <Upload className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Import Excel</span>
                  </Button>

                  <Button 
                    onClick={handleSaveModifications}
                    variant="success"
                    size="sm"
                    className="shadow-lg hover:shadow-xl transition-all text-xs"
                  >
                    <CheckCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Enregistrer</span>
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditMode(true)}
                  variant="premium"
                  size="sm"
                  className="shadow-lg hover:shadow-xl transition-all text-xs"
                >
                  <Edit className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Modifier l'emploi du temps</span>
                  <span className="sm:hidden">Modifier</span>
                </Button>
              )}
            </div>
          </div>

            {/* Navigation et vues identiques */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <WeekNavigator 
                currentDate={selectedDate}
                onNavigate={handleNavigate}
              />

              <ViewModeSelector
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {/* Barre de navigation par semaine - Collapsible */}
            <Collapsible open={isWeekNavigationOpen} onOpenChange={setIsWeekNavigationOpen} className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Navigation par semaines</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isWeekNavigationOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <WeekNavigation
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onWeekSelect={(weekStartDate) => {
                    setSelectedDate(weekStartDate);
                    if (viewMode !== 'week') {
                      setViewMode('week');
                    }
                  }}
                  className="bg-background/95 backdrop-blur-sm border-border"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Contenu principal */}
        {renderCurrentView()}

        {/* Modals - toujours montées pour éviter les problèmes d'ouverture */}
        <AddSlotModal
          isOpen={isAddSlotModalOpen}
          onClose={() => setIsAddSlotModalOpen(false)}
          onSuccess={handleSlotAdded}
          scheduleId={selectedSchedule?.id || ''}
          formationId={selectedSchedule?.formation_id || ''}
          selectedSlot={selectedSlot}
        />

        <EditSlotModal
          isOpen={isEditSlotModalOpen}
          onClose={() => setIsEditSlotModalOpen(false)}
          onSuccess={handleSlotEdited}
          formationId={selectedSchedule?.formation_id || ''}
          slot={slotToEdit}
        />

        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
          onSuccess={handleExcelImportSuccess}
          scheduleId={selectedSchedule?.id || ''}
          formationId={selectedSchedule?.formation_id || ''}
        />

        <EventDetailsModal
          event={detailsEvent}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onEdit={isEditMode ? (event) => {
            const slot = slots.find(s => s.id === event.id);
            if (slot) {
              handleEditSlot(slot);
            }
          } : undefined}
          onDelete={isEditMode ? (eventId) => {
            const slot = slots.find(s => s.id === eventId);
            if (slot) {
              handleDeleteSlot(slot);
            }
          } : undefined}
          canEdit={isEditMode}
        />
      </div>
    );
  }

  // List view (default) - Interface identique à l'emploi du temps principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-primary/10">
      {/* Header moderne identique */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-3xl font-bold text-foreground truncate">Gestion des Emplois du Temps</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Créez et gérez les emplois du temps pour chaque formation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={handleCreateSchedule}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all hover:scale-105 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Créer un Emploi du Temps</span>
                <span className="sm:hidden">Créer</span>
              </Button>
            </div>
          </div>

          {/* Navigation et vues identiques à l'emploi du temps */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <WeekNavigator 
              currentDate={selectedDate}
              onNavigate={handleNavigate}
            />

            <div className="flex items-center space-x-2 justify-end">
              {/* Toggle vue liste/cartes */}
              <Tabs value={scheduleListViewMode} onValueChange={(value) => setScheduleListViewMode(value as 'grid' | 'list')} className="w-auto">
                <TabsList>
                  <TabsTrigger value="grid" className="px-3">
                    <Grid3X3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list" className="px-3">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Barre de navigation par semaine - Collapsible */}
          <Collapsible open={isWeekNavigationOpen} onOpenChange={setIsWeekNavigationOpen} className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Navigation par semaines</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isWeekNavigationOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <WeekNavigation
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                className="bg-background/95 backdrop-blur-sm border-border"
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {schedules.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50 bg-card/30">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun emploi du temps
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Commencez par créer votre premier emploi du temps pour organiser les cours et formations.
              </p>
              <Button onClick={handleCreateSchedule} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Créer un emploi du temps
              </Button>
            </CardContent>
          </Card>
        ) : scheduleListViewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {schedules.map((schedule) => (
              <Card
                key={schedule.id}
                className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card shadow-md hover:shadow-primary/10 cursor-pointer`}
                onClick={() => handleViewSchedule(schedule.id)}
              >
                <CardHeader className="pb-3 p-3 sm:p-6 sm:pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm sm:text-lg font-bold text-foreground truncate">
                        {schedule.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] sm:text-xs bg-primary/10 text-primary border-primary/20 truncate max-w-[120px] sm:max-w-none">
                          {schedule.formations?.title || 'Formation'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 p-3 sm:p-6 pt-0">
                  <div className="space-y-1">
                    <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>{new Date(schedule.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  
                  {/* Actions admin */}
                  <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewSchedule(schedule.id);
                      }}
                      className="flex-1 text-[10px] sm:text-xs h-7 sm:h-8"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Consulter</span>
                      <span className="sm:hidden">Voir</span>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchedule(schedule.id, schedule.title);
                      }}
                      className="text-[10px] sm:text-xs text-destructive hover:text-destructive h-7 sm:h-8 px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {schedules.map((schedule) => (
              <Card
                key={schedule.id}
                className="overflow-hidden transition-all duration-200 hover:shadow-lg border-border/50 bg-card shadow-sm hover:shadow-primary/10 cursor-pointer"
                onClick={() => handleViewSchedule(schedule.id)}
              >
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-lg font-bold text-foreground truncate">
                            {schedule.title}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs bg-primary/10 text-primary border-primary/20 truncate max-w-[100px] sm:max-w-none">
                            {schedule.formations?.title || 'Formation'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
                          <div className="flex items-center text-[10px] sm:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                            <span>{new Date(schedule.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSchedule(schedule.id);
                        }}
                        className="text-xs sm:text-sm h-8"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Consulter</span>
                        <span className="sm:hidden">Voir</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule(schedule.id, schedule.title);
                        }}
                        className="text-destructive hover:text-destructive h-8 px-2"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals - Gestion simplifiée */}
      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <AddSlotModal
        isOpen={isAddSlotModalOpen}
        onClose={() => setIsAddSlotModalOpen(false)}
        onSuccess={handleSlotAdded}
        scheduleId={selectedSchedule?.id || ''}
        formationId={selectedSchedule?.formation_id || ''}
        selectedSlot={selectedSlot}
      />

      <EditSlotModal
        isOpen={isEditSlotModalOpen}
        onClose={() => setIsEditSlotModalOpen(false)}
        onSuccess={handleSlotEdited}
        formationId={selectedSchedule?.formation_id || ''}
        slot={slotToEdit}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={handleExcelImportSuccess}
        scheduleId={selectedSchedule?.id || ''}
        formationId={selectedSchedule?.formation_id || ''}
      />

      <EventDetailsModal
        event={detailsEvent}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={isEditMode ? (event) => {
          // Trouver le slot correspondant pour l'éditer
          const slot = slots.find(s => s.id === event.id);
          if (slot) {
            handleEditSlot(slot);
          }
        } : undefined}
        onDelete={isEditMode ? (eventId) => {
          const slot = slots.find(s => s.id === eventId);
          if (slot) {
            handleDeleteSlot(slot);
          }
        } : undefined}
        canEdit={isEditMode}
      />
    </div>
  );
};

export default ScheduleManagement;