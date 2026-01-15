import React from 'react';
import { CalendarClock, Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'day' | 'week' | 'month' | 'list';

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  viewMode,
  onViewModeChange
}) => {
  const viewModes = [
    { id: 'day' as ViewMode, label: 'Jour', icon: CalendarClock },
    { id: 'week' as ViewMode, label: 'Semaine', icon: CalendarClock },
    { id: 'month' as ViewMode, label: 'Mois', icon: Calendar },
    { id: 'list' as ViewMode, label: 'Liste', icon: List }
  ];

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border overflow-x-auto">
      {viewModes.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={viewMode === id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange(id)}
          className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm flex-shrink-0 ${
            viewMode === id 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'hover:bg-primary/10'
          }`}
        >
          <Icon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
};
