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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, FileText, Calendar as CalendarIcon, Printer, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ExportModalProps {
  onExport: (options: ExportOptions) => void;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeDetails: boolean;
  includeInstructors: boolean;
  includeRooms: boolean;
  groupBy: 'day' | 'instructor' | 'formation';
}

export const ExportModal: React.FC<ExportModalProps> = ({ onExport }) => {
  const [open, setOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
    },
    includeDetails: true,
    includeInstructors: true,
    includeRooms: true,
    groupBy: 'day'
  });
  const { toast } = useToast();

  const handleExport = () => {
    onExport(exportOptions);
    
    toast({
      title: "Export en cours",
      description: `Génération du fichier ${exportOptions.format.toUpperCase()} en cours...`,
    });
    
    setOpen(false);
  };

  const handleQuickExport = (type: 'print' | 'email') => {
    if (type === 'print') {
      window.print();
      toast({
        title: "Impression",
        description: "Ouverture de la boîte de dialogue d'impression...",
      });
    } else {
      toast({
        title: "Envoi par email",
        description: "Fonctionnalité d'envoi par email en développement...",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Exporter l'emploi du temps
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Actions rapides */}
          <div className="flex space-x-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickExport('print')}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickExport('email')}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer par email
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Format d'export */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Format d'export</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: 'pdf' | 'excel' | 'csv') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF - Portable Document Format</SelectItem>
                  <SelectItem value="excel">Excel - Feuille de calcul</SelectItem>
                  <SelectItem value="csv">CSV - Données séparées par virgule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Groupement */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Grouper par</Label>
              <Select 
                value={exportOptions.groupBy} 
                onValueChange={(value: 'day' | 'instructor' | 'formation') => 
                  setExportOptions(prev => ({ ...prev, groupBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="instructor">Formateur</SelectItem>
                  <SelectItem value="formation">Formation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Période d'export */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Période d'export</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !exportOptions.dateRange.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(exportOptions.dateRange.start, "PPP", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.dateRange.start}
                      onSelect={(date) => date && setExportOptions(prev => ({ 
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
                <Label className="text-sm">Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !exportOptions.dateRange.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(exportOptions.dateRange.end, "PPP", { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportOptions.dateRange.end}
                      onSelect={(date) => date && setExportOptions(prev => ({ 
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

          {/* Options d'inclusion */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Inclure dans l'export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={exportOptions.includeDetails}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeDetails: checked as boolean }))
                  }
                />
                <Label htmlFor="includeDetails" className="text-sm">
                  Détails des cours (descriptions, notes)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInstructors"
                  checked={exportOptions.includeInstructors}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeInstructors: checked as boolean }))
                  }
                />
                <Label htmlFor="includeInstructors" className="text-sm">
                  Informations des formateurs
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRooms"
                  checked={exportOptions.includeRooms}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeRooms: checked as boolean }))
                  }
                />
                <Label htmlFor="includeRooms" className="text-sm">
                  Informations des salles
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};