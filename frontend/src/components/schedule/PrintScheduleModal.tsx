import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Printer, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScheduleSlot } from '@/services/scheduleService';
import { exportScheduleToPDFAdvanced } from '@/services/pdfScheduleService';
import { useEstablishment } from '@/hooks/useEstablishment';

export interface PrintOptions {
  viewMode: 'day' | 'week' | 'month' | 'list';
  dateRange: {
    start: Date;
    end: Date;
  };
  orientation: 'portrait' | 'landscape';
  showFormationName?: boolean;
  formationTitle?: string;
}

interface PrintScheduleModalProps {
  schedules: ScheduleSlot[];
  title?: string;
  userName?: string;
  userRole?: string;
  triggerClassName?: string;
  showFormationName?: boolean; // true pour formateurs uniquement
  formationTitle?: string; // titre de la formation pour le header
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  schedules,
  title = "Emploi du temps",
  userName,
  userRole,
  triggerClassName,
  showFormationName = false,
  formationTitle
}) => {
  const [open, setOpen] = useState(false);
  const { establishment } = useEstablishment();
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    viewMode: 'week',
    dateRange: {
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    },
    orientation: 'landscape',
  });
  const { toast } = useToast();

  const handleViewModeChange = (mode: 'day' | 'week' | 'month' | 'list') => {
    const today = new Date();
    let start: Date, end: Date;

    switch (mode) {
      case 'day': {
        const todayNoTime = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        start = todayNoTime;
        end = todayNoTime;
        break;
      }
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'list':
        // Pour la liste, on prend tout
        start = new Date(2020, 0, 1);
        end = new Date(2030, 11, 31);
        break;
      default:
        start = today;
        end = today;
    }

    setPrintOptions(prev => ({
      ...prev,
      viewMode: mode,
      dateRange: { start, end }
    }));
  };

  const handlePrint = () => {
    // Normaliser les dates pour ignorer l'heure (évite les décalages de fuseau horaire)
    const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Filtrer les créneaux selon la plage de dates (comparaison sur la date uniquement)
    const filteredSchedules = schedules.filter(slot => {
      const slotDateRaw = new Date(slot.date);
      const slotDate = normalizeDate(slotDateRaw);
      const start = normalizeDate(printOptions.dateRange.start);
      const end = normalizeDate(printOptions.dateRange.end);
      return slotDate >= start && slotDate <= end;
    });

    if (filteredSchedules.length === 0) {
      toast({
        title: "Aucun créneau",
        description: "Aucun cours trouvé pour la période sélectionnée.",
        variant: "destructive"
      });
      return;
    }

    // Ajouter les options pour formation
    const pdfOptions = {
      ...printOptions,
      showFormationName,
      formationTitle
    };

    exportScheduleToPDFAdvanced(
      filteredSchedules,
      title,
      pdfOptions,
      userRole,
      userName,
      establishment ? { name: establishment.name, logo_url: establishment.logo_url } : null
    );

    toast({
      title: "Export PDF généré",
      description: `L'emploi du temps a été exporté en PDF (${printOptions.orientation === 'portrait' ? 'Portrait' : 'Paysage'}).`,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Printer className="h-5 w-5 mr-2" />
            Options d'impression
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vue à imprimer */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Vue à imprimer</Label>
            <RadioGroup
              value={printOptions.viewMode}
              onValueChange={(value) => handleViewModeChange(value as 'day' | 'week' | 'month' | 'list')}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="day" id="day" />
                <Label htmlFor="day" className="cursor-pointer">Jour</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="week" id="week" />
                <Label htmlFor="week" className="cursor-pointer">Semaine</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="month" id="month" />
                <Label htmlFor="month" className="cursor-pointer">Mois</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="list" id="list" />
                <Label htmlFor="list" className="cursor-pointer">Liste complète</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Période personnalisée */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Période</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Du</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !printOptions.dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(printOptions.dateRange.start, "dd/MM/yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={printOptions.dateRange.start}
                      onSelect={(date) => date && setPrintOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: date }
                      }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Au</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !printOptions.dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(printOptions.dateRange.end, "dd/MM/yyyy", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={printOptions.dateRange.end}
                      onSelect={(date) => date && setPrintOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: date }
                      }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Orientation */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Orientation</Label>
            <RadioGroup
              value={printOptions.orientation}
              onValueChange={(value) => setPrintOptions(prev => ({
                ...prev,
                orientation: value as 'portrait' | 'landscape'
              }))}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="cursor-pointer flex items-center gap-2">
                  <div className="w-4 h-6 border-2 border-current rounded-sm" />
                  Portrait
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="cursor-pointer flex items-center gap-2">
                  <div className="w-6 h-4 border-2 border-current rounded-sm" />
                  Paysage
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aperçu info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Aperçu:</strong> Export {printOptions.viewMode === 'list' ? 'liste complète' : `vue ${printOptions.viewMode === 'day' ? 'jour' : printOptions.viewMode === 'week' ? 'semaine' : 'mois'}`} du {format(printOptions.dateRange.start, "dd/MM/yyyy")} au {format(printOptions.dateRange.end, "dd/MM/yyyy")} en format {printOptions.orientation === 'portrait' ? 'portrait' : 'paysage'} A4.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer en PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
