import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  LayoutGrid, 
  BarChart3, 
  Search, 
  Download, 
  Settings, 
  Bell,
  Zap,
  Sparkles
} from 'lucide-react';
import { ScheduleSlot } from '@/services/scheduleService';
import { Button } from '@/components/ui/button';
import { TimelineView } from './TimelineView';
import { KanbanView } from './KanbanView';
import { DashboardView } from './DashboardView';
import { MasonryView } from './MasonryView';
import { exportScheduleToPDF } from '@/services/pdfScheduleService';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'timeline' | 'kanban' | 'dashboard' | 'masonry';

interface ModernScheduleViewProps {
  schedules: ScheduleSlot[];
  userRole?: string;
  userId?: string;
}

export const ModernScheduleView: React.FC<ModernScheduleViewProps> = ({ 
  schedules, 
  userRole,
  userId 
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();

  const viewModes = [
    {
      id: 'dashboard' as ViewMode,
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Vue complète avec statistiques',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'timeline' as ViewMode,
      name: 'Timeline',
      icon: Clock,
      description: 'Chronologie interactive',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'kanban' as ViewMode,
      name: 'Kanban',
      icon: LayoutGrid,
      description: 'Organisation par colonnes',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'masonry' as ViewMode,
      name: 'Mosaïque',
      icon: Sparkles,
      description: 'Cartes adaptatives',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleExportPDF = () => {
    try {
      if (schedules.length === 0) {
        toast({
          title: "Aucun cours",
          description: "Aucun cours à exporter.",
          variant: "destructive",
        });
        return;
      }

      const title = `Emploi du Temps - ${new Date().toLocaleDateString('fr-FR')}`;
      exportScheduleToPDF(
        schedules,
        title,
        userRole,
        userId || '',
        new Date(),
        new Date()
      );

      toast({
        title: "Export réussi",
        description: "Emploi du temps exporté en PDF",
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'exportation du PDF",
        variant: "destructive",
      });
    }
  };

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'timeline':
        return <TimelineView schedules={schedules} selectedDate={selectedDate} />;
      case 'kanban':
        return <KanbanView schedules={schedules} selectedDate={selectedDate} />;
      case 'dashboard':
        return <DashboardView schedules={schedules} selectedDate={selectedDate} onDateChange={setSelectedDate} />;
      case 'masonry':
        return <MasonryView schedules={schedules} selectedDate={selectedDate} />;
      default:
        return <DashboardView schedules={schedules} selectedDate={selectedDate} onDateChange={setSelectedDate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl nect-gradient flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Emploi du Temps</h1>
                <p className="text-sm text-muted-foreground">Interface moderne et intuitive</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`
                    group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 min-w-fit
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-102'
                    }
                  `}
                >
                  {isActive && (
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${mode.color} opacity-20 animate-pulse`} />
                  )}
                  
                  <div className="relative flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'animate-float' : 'group-hover:scale-110'} transition-transform`} />
                    <div className="text-left">
                      <div className="font-semibold text-sm">{mode.name}</div>
                      <div className="text-xs opacity-80">{mode.description}</div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="relative">
        {renderCurrentView()}
        
        {/* Floating action button for quick actions */}
        <div className="fixed bottom-6 right-6 z-40">
          <Button 
            size="lg" 
            className="rounded-full w-14 h-14 shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-110"
          >
            <Zap className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};