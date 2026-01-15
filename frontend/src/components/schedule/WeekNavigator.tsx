import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeekNavigatorProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  currentDate,
  onNavigate
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('prev')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800 rounded-lg sm:rounded-xl">
          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-300 flex-shrink-0" />
          <span className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white text-center whitespace-nowrap">
            {format(currentDate, 'MMM yyyy', { locale: fr })}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('today')}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm px-2 sm:px-3"
        >
          Aujourd'hui
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate('next')}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
