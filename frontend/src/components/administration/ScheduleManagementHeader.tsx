import React from 'react';
import { Calendar, Clock, Users, BookOpen, Plus, FileSpreadsheet, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Schedule } from '@/services/scheduleService';

interface ScheduleManagementHeaderProps {
  currentDate: Date;
  weekInfo: { start: string; end: string };
  viewMode: string;
  selectedSchedule: Schedule | null;
  schedulesCount: number;
  slotsCount: number;
  onAddSlot: () => void;
  onImportExcel: () => void;
  onPublishSchedule?: () => void;
  onBackToList: () => void;
  readOnly?: boolean;
}

export const ScheduleManagementHeader: React.FC<ScheduleManagementHeaderProps> = ({
  currentDate,
  weekInfo,
  viewMode,
  selectedSchedule,
  schedulesCount,
  slotsCount,
  onAddSlot,
  onImportExcel,
  onPublishSchedule,
  onBackToList,
  readOnly = false
}) => {
  const getTitle = () => {
    if (selectedSchedule) {
      return selectedSchedule.title;
    }
    return 'Gestion des Emplois du Temps';
  };

  const getSubtitle = () => {
    if (selectedSchedule) {
      return `${selectedSchedule.formations?.title || 'Formation'} • ${selectedSchedule.academic_year} • ${slotsCount} créneaux`;
    }
    return `Gestion et création des emplois du temps • ${schedulesCount} emplois du temps`;
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-3xl font-bold text-foreground truncate">{getTitle()}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {getSubtitle()} • {' '}
                {viewMode === 'month' 
                  ? format(currentDate, 'MMMM yyyy', { locale: fr })
                  : `Semaine du ${weekInfo.start} au ${weekInfo.end}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Badges informatifs */}
            <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {slotsCount} créneaux
            </Badge>
            
            {selectedSchedule && (
              <>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${selectedSchedule.status === 'Publié' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}
                >
                  {selectedSchedule.status}
                </Badge>

                {/* Boutons d'action pour un emploi du temps sélectionné */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onBackToList}
                  className="hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 text-xs"
                >
                  <Eye className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Retour à la liste</span>
                </Button>

                {!readOnly && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onImportExcel}
                      className="hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 text-xs"
                    >
                      <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Import Excel</span>
                    </Button>

                    <Button 
                      onClick={onAddSlot}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 text-xs"
                    >
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Ajouter un créneau</span>
                    </Button>

                    {onPublishSchedule && (
                      <Button 
                        onClick={onPublishSchedule}
                        size="sm"
                        disabled={slotsCount === 0}
                        variant="default"
                        className="bg-success hover:bg-success/90 hover:shadow-lg hover:shadow-success/25 transition-all duration-300 text-xs"
                      >
                        <CheckCircle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Enregistrer et publier</span>
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};