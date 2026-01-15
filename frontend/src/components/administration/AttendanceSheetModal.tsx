import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Clock, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AttendanceSheet, attendanceService } from '@/services/attendanceService';
import { pdfExportService } from '@/services/pdfExportService';
import AttendanceSheetView from '@/components/emargement/AttendanceSheetView';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onUpdate: () => void;
}

const AttendanceSheetModal: React.FC<AttendanceSheetModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState(attendanceSheet);

  useEffect(() => {
    const loadDetailedSheet = async () => {
      if (!attendanceSheet?.id) {
        setSheet(attendanceSheet);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('attendance_sheets')
          .select(`
            *,
            formations!formation_id(title, level),
            instructor:users!instructor_id(first_name, last_name),
            attendance_signatures(*, users(first_name, last_name, email))
          `)
          .eq('id', attendanceSheet.id)
          .single();

        if (error || !data) {
          console.error('Erreur chargement feuille détaillée, utilisation des données existantes', error);
          setSheet(attendanceSheet);
          return;
        }

        // Normaliser les champs pour correspondre à l'interface AttendanceSheet
        const normalizedSheet: AttendanceSheet = {
          ...(attendanceSheet as AttendanceSheet),
          ...(data as any),
          instructor: (data as any).instructor ?? (attendanceSheet as any).instructor ?? null,
          signatures: (data as any).attendance_signatures ?? (attendanceSheet as any).signatures ?? []
        };

        setSheet(normalizedSheet);
      } catch (err) {
        console.error('Erreur chargement feuille détaillée:', err);
        setSheet(attendanceSheet);
      }
    };

    if (isOpen) {
      loadDetailedSheet();
    } else {
      setSheet(attendanceSheet);
    }
  }, [attendanceSheet, isOpen]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setLoading(true);
      await attendanceService.updateAttendanceSheetStatus(sheet.id, newStatus);
      setSheet({ ...sheet, status: newStatus });
      toast.success('Statut mis à jour avec succès');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await pdfExportService.exportAttendanceSheetSimple(sheet);
      toast.success('Feuille d\'émargement exportée en PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const handleValidateSheet = async () => {
    try {
      await attendanceService.updateAttendanceSheetStatus(sheet.id, 'Fermé');
      setSheet({ ...sheet, status: 'Fermé' });
      toast.success('Feuille d\'émargement validée et fermée');
      onUpdate();
    } catch (error) {
      console.error('Error validating sheet:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'En cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Terminé':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Fermé':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Feuille d'émargement</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div id="attendance-sheet-export">
          <AttendanceSheetView
            attendanceSheet={sheet}
            onExportPDF={handleExportPDF}
            onValidate={handleValidateSheet}
            showActions={true}
          />
        </div>

        {/* Administration Controls */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Statut:</label>
                <Select value={sheet.status} onValueChange={handleStatusUpdate} disabled={loading}>
                  <SelectTrigger className="w-48 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Terminé">Terminé</SelectItem>
                    <SelectItem value="Fermé">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceSheetModal;