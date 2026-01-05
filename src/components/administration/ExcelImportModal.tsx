import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getModuleColor } from '@/utils/moduleColors';
import { scheduleService } from '@/services/scheduleService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleId: string;
  formationId?: string;
}

interface ParsedSlot {
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  formateur: string;
  classe: string;
  isValid: boolean;
  errorMessage?: string;
  moduleId?: string;
  instructorId?: string;
}

interface ModuleData {
  id: string;
  title: string;
}

interface InstructorData {
  id: string;
  first_name: string;
  last_name: string;
}

// Fonction pour convertir une date Excel (numéro sériel) en chaîne YYYY-MM-DD
const excelDateToString = (excelDate: any): string => {
  // Si c'est déjà une chaîne au format YYYY-MM-DD
  if (typeof excelDate === 'string') {
    // Vérifier si c'est au format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
      return excelDate;
    }
    // Vérifier si c'est au format DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(excelDate)) {
      const [day, month, year] = excelDate.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Vérifier si c'est au format DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(excelDate)) {
      const [day, month, year] = excelDate.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Essayer de parser comme date
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  // Si c'est un numéro sériel Excel
  if (typeof excelDate === 'number') {
    // Excel utilise 1900 comme année de base, mais avec un bug pour 1900 comme année bissextile
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  return '';
};

// Fonction pour normaliser le format de l'horaire
const normalizeTime = (time: string): string => {
  if (!time) return '';
  
  // Nettoyer les espaces
  time = time.trim();
  
  // Si format HH:MM, retourner tel quel
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Si format H:MM ou HH:M
  if (/^\d{1,2}:\d{1,2}$/.test(time)) {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Si format HHMM (sans séparateur)
  if (/^\d{4}$/.test(time)) {
    return `${time.slice(0, 2)}:${time.slice(2)}`;
  }
  
  // Si format décimal Excel (0.5 = 12:00)
  const num = parseFloat(time);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return time;
};

// Fonction pour parser l'horaire (format: "08:00-12:00" ou "08:00 - 12:00")
const parseHoraire = (horaire: string): { startTime: string; endTime: string } | null => {
  if (!horaire) return null;
  
  // Nettoyer et normaliser
  const cleaned = horaire.toString().trim();
  
  // Essayer différents séparateurs
  const separators = ['-', '–', '—', ' - ', ' – ', ' — ', 'à', ' à '];
  
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map(p => p.trim());
      if (parts.length === 2) {
        const startTime = normalizeTime(parts[0]);
        const endTime = normalizeTime(parts[1]);
        
        if (startTime && endTime) {
          return { startTime, endTime };
        }
      }
    }
  }
  
  return null;
};

const ExcelImportModal = ({ isOpen, onClose, onSuccess, scheduleId, formationId }: ExcelImportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ParsedSlot[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [instructors, setInstructors] = useState<InstructorData[]>([]);

  // Charger les modules et formateurs de la formation
  useEffect(() => {
    const loadFormationData = async () => {
      if (!formationId) return;

      try {
        // Charger les modules de la formation
        const { data: modulesData } = await supabase
          .from('formation_modules')
          .select('id, title')
          .eq('formation_id', formationId);
        
        if (modulesData) {
          setModules(modulesData);
        }

        // Charger les formateurs (tous les utilisateurs avec le rôle Formateur de l'établissement)
        const { data: userData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('role', 'Formateur');
        
        if (userData) {
          setInstructors(userData);
        }
      } catch (error) {
        console.error('Erreur chargement données formation:', error);
      }
    };

    if (isOpen) {
      loadFormationData();
    }
  }, [isOpen, formationId]);

  // Fonction pour trouver un module par nom (recherche flexible)
  const findModuleByName = (moduleName: string): ModuleData | undefined => {
    if (!moduleName) return undefined;
    const normalizedName = moduleName.toLowerCase().trim();
    return modules.find(m => 
      m.title.toLowerCase().trim() === normalizedName ||
      m.title.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(m.title.toLowerCase())
    );
  };

  // Fonction pour trouver un formateur par nom (recherche flexible)
  const findInstructorByName = (formateurName: string): InstructorData | undefined => {
    if (!formateurName) return undefined;
    const normalizedName = formateurName.toLowerCase().trim();
    
    return instructors.find(i => {
      const fullName = `${i.first_name} ${i.last_name}`.toLowerCase();
      const reverseName = `${i.last_name} ${i.first_name}`.toLowerCase();
      return fullName === normalizedName || 
             reverseName === normalizedName ||
             fullName.includes(normalizedName) ||
             normalizedName.includes(fullName) ||
             i.first_name.toLowerCase() === normalizedName ||
             i.last_name.toLowerCase() === normalizedName;
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Date': '2025-09-22',
        'Horaire (Début - Fin)': '08:00-12:00',
        'Module': 'Marketing Digital',
        'Formateur': 'Dupont Jean',
        'Salle': 'Salle A101'
      },
      {
        'Date': '2025-09-22',
        'Horaire (Début - Fin)': '13:00-17:00',
        'Module': 'Gestion de Paie',
        'Formateur': 'Martin Claire',
        'Salle': 'Salle B202'
      },
      {
        'Date': '2025-09-23',
        'Horaire (Début - Fin)': '08:00-12:00',
        'Module': 'Développement Web',
        'Formateur': 'Bernard Sophie',
        'Salle': 'Labo Info'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    
    // Définir la largeur des colonnes
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 22 }, // Horaire
      { wch: 25 }, // Module
      { wch: 20 }, // Formateur
      { wch: 15 }  // Salle
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Emploi du temps');
    XLSX.writeFile(wb, 'modele_emploi_temps.xlsx');
    toast.success('Modèle téléchargé avec succès');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setPreviewData([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: false, raw: false });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

      if (jsonData.length === 0) {
        setParseError('Le fichier Excel est vide ou mal formaté.');
        return;
      }

      const parsedSlots: ParsedSlot[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        // Trouver les colonnes avec une recherche flexible
        const dateValue = row['Date'] || row['date'] || row['DATE'];
        const horaireValue = row['Horaire (Début - Fin)'] || row['Horaire'] || row['horaire'] || 
                           row['Horaires'] || row['HORAIRE'] || row['Heure'] || row['heure'];
        const moduleValue = row['Module'] || row['module'] || row['MODULE'] || 
                           row['Matière'] || row['matière'] || row['MATIERE'];
        const formateurValue = row['Formateur'] || row['formateur'] || row['FORMATEUR'] ||
                              row['Intervenant'] || row['intervenant'] || row['Prof'] || row['prof'];
        const salleValue = row['Salle'] || row['salle'] || row['SALLE'] || 
                          row['Classe'] || row['classe'] || row['Room'] || row['room'];

        let slot: ParsedSlot = {
          date: '',
          startTime: '',
          endTime: '',
          module: String(moduleValue || '').trim(),
          formateur: String(formateurValue || '').trim(),
          classe: String(salleValue || '').trim(),
          isValid: true,
          moduleId: undefined,
          instructorId: undefined
        };

        // Parser la date
        if (dateValue) {
          slot.date = excelDateToString(dateValue);
          if (!slot.date) {
            slot.isValid = false;
            slot.errorMessage = `Ligne ${i + 2}: Format de date invalide "${dateValue}"`;
          }
        } else {
          slot.isValid = false;
          slot.errorMessage = `Ligne ${i + 2}: Date manquante`;
        }

        // Parser l'horaire
        if (horaireValue) {
          const parsed = parseHoraire(String(horaireValue));
          if (parsed) {
            slot.startTime = parsed.startTime;
            slot.endTime = parsed.endTime;
          } else {
            slot.isValid = false;
            slot.errorMessage = `Ligne ${i + 2}: Format d'horaire invalide "${horaireValue}" (attendu: 08:00-12:00)`;
          }
        } else {
          slot.isValid = false;
          slot.errorMessage = `Ligne ${i + 2}: Horaire manquant`;
        }

        // Vérifier le module et résoudre l'ID
        if (!slot.module) {
          slot.isValid = false;
          slot.errorMessage = `Ligne ${i + 2}: Module manquant`;
        } else {
          // Essayer de trouver le module correspondant dans la base
          const foundModule = findModuleByName(slot.module);
          if (foundModule) {
            slot.moduleId = foundModule.id;
          }
        }

        // Résoudre l'ID du formateur
        if (slot.formateur) {
          const foundInstructor = findInstructorByName(slot.formateur);
          if (foundInstructor) {
            slot.instructorId = foundInstructor.id;
          }
        }

        parsedSlots.push(slot);
      }

      setPreviewData(parsedSlots);

      const invalidCount = parsedSlots.filter(s => !s.isValid).length;
      if (invalidCount > 0 && invalidCount === parsedSlots.length) {
        setParseError(`Toutes les lignes (${invalidCount}) contiennent des erreurs. Vérifiez le format du fichier.`);
      } else if (invalidCount > 0) {
        toast.warning(`${invalidCount} ligne(s) avec des erreurs seront ignorées`);
      }

    } catch (error) {
      console.error('Erreur parsing Excel:', error);
      setParseError('Erreur lors de la lecture du fichier Excel. Vérifiez que le fichier est valide.');
    }
  };

  const processImport = async () => {
    const validSlots = previewData.filter(s => s.isValid);
    
    if (validSlots.length === 0) {
      toast.error('Aucun créneau valide à importer');
      return;
    }

    try {
      setLoading(true);
      
      let successCount = 0;
      let errorCount = 0;

      for (const slot of validSlots) {
        try {
          await scheduleService.createScheduleSlot({
            schedule_id: scheduleId,
            module_id: slot.moduleId || undefined,
            instructor_id: slot.instructorId || undefined,
            date: slot.date,
            start_time: slot.startTime,
            end_time: slot.endTime,
            room: slot.classe || undefined,
            color: getModuleColor(slot.module),
            notes: (!slot.moduleId || !slot.instructorId) 
              ? `${slot.module}${slot.formateur ? ` - ${slot.formateur}` : ''}` 
              : undefined
          });
          successCount++;
        } catch (error) {
          console.error('Erreur import slot:', slot, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} créneau(x) importé(s) avec succès`);
        onSuccess();
        handleReset();
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} créneau(x) n'ont pas pu être importés`);
      }

    } catch (error) {
      console.error('Erreur import:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setParseError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validCount = previewData.filter(s => s.isValid).length;
  const invalidCount = previewData.filter(s => !s.isValid).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Excel - Emploi du temps
          </DialogTitle>
          <DialogDescription>
            Importez plusieurs créneaux à partir d'un fichier Excel
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center text-sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Format attendu
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Date</strong> : format AAAA-MM-JJ (ex: 2025-09-22)</li>
              <li>• <strong>Horaire (Début - Fin)</strong> : format HH:MM-HH:MM (ex: 08:00-12:00)</li>
              <li>• <strong>Module</strong> : nom du cours/module</li>
              <li>• <strong>Formateur</strong> : nom de l'intervenant (optionnel)</li>
              <li>• <strong>Salle</strong> : lieu du cours (optionnel)</li>
            </ul>
          </div>

          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le modèle Excel
            </Button>

            <div className="space-y-2">
              <Label htmlFor="excel-file">Fichier Excel</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Erreur de parsing */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Aperçu des données */}
          {previewData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {validCount} créneau(x) valide(s)
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-sm text-destructive">
                      ({invalidCount} avec erreurs)
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              </div>

              <ScrollArea className="flex-1 border rounded-lg max-h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead className="w-[120px]">Horaire</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Formateur</TableHead>
                      <TableHead>Salle</TableHead>
                      <TableHead className="w-[60px]">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((slot, index) => (
                      <TableRow 
                        key={index} 
                        className={!slot.isValid ? 'bg-destructive/10' : ''}
                      >
                        <TableCell className="font-mono text-xs">
                          {slot.date || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {slot.startTime && slot.endTime 
                            ? `${slot.startTime}-${slot.endTime}` 
                            : '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={slot.module}>
                          <div className="flex items-center gap-1">
                            <span className={slot.moduleId ? 'text-green-700' : 'text-amber-600'}>
                              {slot.module || '-'}
                            </span>
                            {slot.moduleId && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate" title={slot.formateur}>
                          <div className="flex items-center gap-1">
                            <span className={slot.instructorId ? 'text-green-700' : (slot.formateur ? 'text-amber-600' : '')}>
                              {slot.formateur || '-'}
                            </span>
                            {slot.instructorId && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[100px] truncate" title={slot.classe}>
                          {slot.classe || '-'}
                        </TableCell>
                        <TableCell>
                          {slot.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <span title={slot.errorMessage}>
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {invalidCount > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Les lignes avec erreurs seront ignorées lors de l'import.
                    Survolez l'icône ⚠️ pour voir le détail de l'erreur.
                  </AlertDescription>
                </Alert>
              )}

              {/* Info sur les modules/formateurs non résolus */}
              {previewData.some(s => s.isValid && (!s.moduleId || !s.instructorId)) && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800">
                    <strong>Module/Formateur en orange</strong> : le nom n'a pas été trouvé dans la base de données. 
                    Le créneau sera créé avec les informations textuelles dans les notes.
                    <br />
                    <span className="text-green-700">✓ Vert</span> = lié automatiquement à la base de données.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              onClick={processImport} 
              disabled={validCount === 0 || loading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Import en cours...' : `Importer ${validCount} créneau(x)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportModal;
