import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onExport: (startDate: Date, endDate: Date, period: string) => void;
}

export const ExportFilterModal = ({ open, onOpenChange, currentDate, onExport }: ExportFilterModalProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');

  const getPeriodDates = (period: string, date: Date) => {
    switch (period) {
      case 'day':
        return {
          start: date,
          end: date,
          label: format(date, 'EEEE d MMMM yyyy', { locale: fr })
        };
      case 'week':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return {
          start: weekStart,
          end: weekEnd,
          label: `Semaine du ${format(weekStart, 'd MMM', { locale: fr })} au ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
        };
      case 'month':
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        return {
          start: monthStart,
          end: monthEnd,
          label: format(date, 'MMMM yyyy', { locale: fr })
        };
      case 'custom-week':
        // Semaine précédente
        const prevWeekStart = startOfWeek(subDays(date, 7), { weekStartsOn: 1 });
        const prevWeekEnd = endOfWeek(subDays(date, 7), { weekStartsOn: 1 });
        return {
          start: prevWeekStart,
          end: prevWeekEnd,
          label: `Semaine précédente (${format(prevWeekStart, 'd MMM', { locale: fr })} au ${format(prevWeekEnd, 'd MMM yyyy', { locale: fr })})`
        };
      case 'next-week':
        // Semaine suivante
        const nextWeekStart = startOfWeek(addDays(date, 7), { weekStartsOn: 1 });
        const nextWeekEnd = endOfWeek(addDays(date, 7), { weekStartsOn: 1 });
        return {
          start: nextWeekStart,
          end: nextWeekEnd,
          label: `Semaine suivante (${format(nextWeekStart, 'd MMM', { locale: fr })} au ${format(nextWeekEnd, 'd MMM yyyy', { locale: fr })})`
        };
      default:
        return getPeriodDates('week', date);
    }
  };

  const handleExport = () => {
    const { start, end, label } = getPeriodDates(selectedPeriod, currentDate);
    onExport(start, end, label);
    onOpenChange(false);
  };

  const periods = [
    { value: 'day', label: 'Jour actuel', description: getPeriodDates('day', currentDate).label },
    { value: 'week', label: 'Semaine actuelle', description: getPeriodDates('week', currentDate).label },
    { value: 'custom-week', label: 'Semaine précédente', description: getPeriodDates('custom-week', currentDate).label },
    { value: 'next-week', label: 'Semaine suivante', description: getPeriodDates('next-week', currentDate).label },
    { value: 'month', label: 'Mois actuel', description: getPeriodDates('month', currentDate).label },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter l'emploi du temps
          </DialogTitle>
          <DialogDescription>
            Choisissez la période à exporter en PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Période d'exportation</Label>
            <RadioGroup 
              value={selectedPeriod} 
              onValueChange={setSelectedPeriod}
              className="mt-3"
            >
              {periods.map((period) => (
                <div key={period.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={period.value} id={period.value} className="mt-1" />
                  <div className="flex-1">
                    <Label 
                      htmlFor={period.value} 
                      className="font-medium cursor-pointer"
                    >
                      {period.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {period.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Aperçu de l'exportation</h4>
                <p className="text-sm text-blue-800 mt-1">
                  {getPeriodDates(selectedPeriod, currentDate).label}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};