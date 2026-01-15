import React from 'react';
import { Calendar, Plus, Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateEventModal } from './CreateEventModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ScheduleHeaderProps {
  currentDate: Date;
  weekInfo: { start: string; end: string };
  viewMode: string;
  onEventCreated: (event: any) => void;
  onImportExcel: () => void;
  onPublish?: () => void;
}

export const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  currentDate,
  weekInfo,
  viewMode,
  onEventCreated,
  onImportExcel,
  onPublish
}) => {
  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Calendar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Emploi du Temps</h1>
              <p className="text-muted-foreground">
                {viewMode === 'month' 
                  ? format(currentDate, 'MMMM yyyy', { locale: fr })
                  : `Semaine du ${weekInfo.start} au ${weekInfo.end}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <CreateEventModal onEventCreated={onEventCreated} />
            
            {onPublish && (
              <Button 
                variant="success" 
                size="sm"
                onClick={onPublish}
                className="hover:shadow-lg hover:shadow-success/25 transition-all duration-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                Publier
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onImportExcel}
              className="hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Import Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};