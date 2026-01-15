import React from 'react';
import { CalendarClock, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Badge } from '@/components/ui/badge';

interface ScheduleViewHeaderProps {
  currentDate: Date;
  weekInfo: { start: string; end: string };
  viewMode: string;
  schedulesCount: number;
  formationTitle?: string;
  studentName?: string;
}

export const ScheduleViewHeader: React.FC<ScheduleViewHeaderProps> = ({
  currentDate,
  weekInfo,
  viewMode,
  schedulesCount,
  formationTitle,
  studentName
}) => {
  const { userRole } = useCurrentUser();

  const getRoleDescription = () => {
    switch (userRole) {
      case 'Étudiant':
        return 'Vos cours et formations';
      case 'Formateur':
        return 'Tous vos créneaux d\'enseignement';
      case 'Tuteur':
        return studentName ? `Emploi du temps de ${studentName}` : 'Emploi du temps de votre apprenti';
      case 'Admin':
      case 'AdminPrincipal':
        return 'Consultation des emplois du temps';
      default:
        return 'Emploi du temps';
    }
  };

  const getTitle = () => {
    // Pour les étudiants avec une formation sélectionnée, afficher le titre de la formation
    if (userRole === 'Étudiant' && formationTitle) {
      return `Emploi du Temps – ${formationTitle}`;
    }
    // Pour les tuteurs, afficher le titre de la formation de l'apprenti
    if (userRole === 'Tuteur' && formationTitle) {
      return `Emploi du Temps – ${formationTitle}`;
    }
    // Pour les admins avec une formation sélectionnée
    if ((userRole === 'Admin' || userRole === 'AdminPrincipal') && formationTitle) {
      return `Emploi du Temps – ${formationTitle}`;
    }
    // Pour les formateurs, vue globale
    if (userRole === 'Formateur') {
      return 'Mon Emploi du Temps';
    }
    return 'Emploi du Temps';
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
              <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                {getTitle()}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {getRoleDescription()} • {' '}
                {viewMode === 'month' 
                  ? format(currentDate, 'MMMM yyyy', { locale: fr })
                  : `Semaine du ${weekInfo.start} au ${weekInfo.end}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {schedulesCount} cours
            </Badge>
            {userRole && (
              <Badge 
                variant="secondary" 
                className="px-2 sm:px-3 py-1 text-xs"
              >
                {userRole}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
