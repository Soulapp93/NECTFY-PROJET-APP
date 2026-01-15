import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExcelImportModalProps {
  onImport: (data: any[]) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ParsedScheduleData {
  module: string;
  date: string;
  startTime: string;
  endTime: string;
  instructor: string;
  room: string;
  formation: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  onImport,
  isOpen,
  onOpenChange
}) => {
  const [open, setOpen] = useState(isOpen || false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedScheduleData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateData = [
      {
        'Module': 'Introduction au Marketing',
        'Date': '2024-01-15',
        'Heure de début': '09:00',
        'Heure de fin': '11:00',
        'Formateur': 'M. Dubois',
        'Salle': 'A101',
        'Formation': 'Marketing Digital'
      },
      {
        'Module': 'Développement Web',
        'Date': '2024-01-16',
        'Heure de début': '14:00',
        'Heure de fin': '16:00',
        'Formateur': 'Mme. Martin',
        'Salle': 'B202',
        'Formation': 'Développement Web'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modèle Emploi du Temps');
    XLSX.writeFile(workbook, 'modele_emploi_du_temps.xlsx');

    toast({
      title: "Modèle téléchargé",
      description: "Le modèle Excel a été téléchargé avec succès",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setPreviewData([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsedData: ParsedScheduleData[] = jsonData.map((row: any, index: number) => {
        // Mapping flexible des colonnes
        const module = row['Module'] || row['module'] || row['Titre'] || row['titre'] || '';
        const date = row['Date'] || row['date'] || '';
        const startTime = row['Heure de début'] || row['heure_debut'] || row['Début'] || row['debut'] || '';
        const endTime = row['Heure de fin'] || row['heure_fin'] || row['Fin'] || row['fin'] || '';
        const instructor = row['Formateur'] || row['formateur'] || row['Instructeur'] || row['instructeur'] || '';
        const room = row['Salle'] || row['salle'] || row['Room'] || row['room'] || '';
        const formation = row['Formation'] || row['formation'] || row['Parcours'] || row['parcours'] || '';

        if (!module || !date) {
          throw new Error(`Ligne ${index + 2}: Module et Date sont obligatoires`);
        }

        return {
          module,
          date,
          startTime,
          endTime,
          instructor,
          room,
          formation
        };
      });

      setPreviewData(parsedData);
    } catch (err) {
      console.error('Erreur lors de l\'import Excel:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) {
      toast({
        title: "Aucune donnée",
        description: "Veuillez d'abord importer un fichier Excel",
        variant: "destructive",
      });
      return;
    }

    onImport(previewData);
    toast({
      title: "Import réussi",
      description: `${previewData.length} créneaux ont été importés avec succès`,
    });

    // Reset et fermer
    setPreviewData([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      // Reset quand on ferme
      setPreviewData([]);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Excel - Emploi du Temps
          </DialogTitle>
          <DialogDescription>
            Importez votre emploi du temps depuis un fichier Excel. Téléchargez d'abord le modèle pour connaître le format requis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Télécharger le modèle */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-foreground">Modèle Excel</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Téléchargez le modèle pour connaître le format requis des colonnes
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le modèle
              </Button>
            </div>
          </div>

          {/* Upload du fichier */}
          <div className="space-y-4">
            <Label htmlFor="excel-file" className="text-base font-semibold">
              Fichier Excel
            </Label>
            <Input
              id="excel-file"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading}
              className="cursor-pointer"
            />
            {loading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Traitement du fichier...
              </p>
            )}
          </div>

          {/* Erreurs */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Aperçu des données */}
          {previewData.length > 0 && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {previewData.length} créneaux détectés. Vérifiez les données ci-dessous avant d'importer.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 border-b">
                  <h4 className="font-semibold">Aperçu des données ({previewData.length} lignes)</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 sticky top-0">
                      <tr>
                        <th className="text-left p-2 border-r">Module</th>
                        <th className="text-left p-2 border-r">Date</th>
                        <th className="text-left p-2 border-r">Début</th>
                        <th className="text-left p-2 border-r">Fin</th>
                        <th className="text-left p-2 border-r">Formateur</th>
                        <th className="text-left p-2 border-r">Salle</th>
                        <th className="text-left p-2">Formation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index} className="border-t hover:bg-muted/20">
                          <td className="p-2 border-r">{row.module}</td>
                          <td className="p-2 border-r">{row.date}</td>
                          <td className="p-2 border-r">{row.startTime}</td>
                          <td className="p-2 border-r">{row.endTime}</td>
                          <td className="p-2 border-r">{row.instructor}</td>
                          <td className="p-2 border-r">{row.room}</td>
                          <td className="p-2">{row.formation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div className="p-2 text-center text-sm text-muted-foreground border-t">
                      ... et {previewData.length - 10} autres lignes
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleImport}
              disabled={previewData.length === 0}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer {previewData.length > 0 && `(${previewData.length} créneaux)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};