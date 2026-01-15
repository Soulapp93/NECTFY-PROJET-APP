import React, { useState } from 'react';
import { FileSpreadsheet, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

interface ExportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    status: string;
    created_at?: string;
    formations?: string;
  }>;
}

const ExportUsersModal: React.FC<ExportUsersModalProps> = ({
  isOpen,
  onClose,
  users
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('excel');

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header with NECTFY branding
    doc.setFillColor(139, 92, 246); // Primary violet color
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NECTFY', 15, 16);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Liste des utilisateurs', pageWidth - 15, 16, { align: 'right' });
    
    // Date
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Exporté le ${currentDate}`, 15, 35);
    doc.text(`${users.length} utilisateur(s)`, pageWidth - 15, 35, { align: 'right' });
    
    // Table headers
    const headers = ['Nom & Prénom', 'Email', 'Rôle', 'Formations', 'Statut', 'Date création'];
    const colWidths = [50, 60, 35, 65, 30, 35];
    const startX = 15;
    let startY = 45;
    
    // Header row
    doc.setFillColor(139, 92, 246);
    doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let xPos = startX + 2;
    headers.forEach((header, index) => {
      doc.text(header, xPos, startY + 7);
      xPos += colWidths[index];
    });
    
    // Data rows
    startY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    
    users.forEach((user, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), 9, 'F');
      }
      
      // Draw row border
      doc.setDrawColor(226, 232, 240);
      doc.line(startX, startY + 9, startX + colWidths.reduce((a, b) => a + b, 0), startY + 9);
      
      xPos = startX + 2;
      const rowData = [
        `${user.first_name} ${user.last_name}`,
        user.email,
        user.role,
        user.formations || 'Aucune',
        user.status,
        user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'
      ];
      
      rowData.forEach((data, colIndex) => {
        // Truncate text if too long
        const maxWidth = colWidths[colIndex] - 4;
        let displayText = data;
        while (doc.getTextWidth(displayText) > maxWidth && displayText.length > 3) {
          displayText = displayText.slice(0, -4) + '...';
        }
        doc.text(displayText, xPos, startY + 6);
        xPos += colWidths[colIndex];
      });
      
      startY += 9;
      
      // New page if needed
      if (startY > pageHeight - 20) {
        doc.addPage('landscape');
        startY = 20;
      }
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Document généré par NECTFY - Plateforme de gestion de formation', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    const filename = `utilisateurs_nectfy_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast.success('Export PDF réalisé avec succès');
    onClose();
  };

  const exportToExcel = () => {
    // Prepare data with proper formatting
    const exportData = users.map((user, index) => ({
      'N°': index + 1,
      'Prénom': user.first_name,
      'Nom': user.last_name,
      'Email': user.email,
      'Rôle': user.role,
      'Formations': user.formations || 'Aucune formation',
      'Statut': user.status,
      'Date de création': user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for professional appearance
    ws['!cols'] = [
      { wch: 5 },   // N°
      { wch: 15 },  // Prénom
      { wch: 15 },  // Nom
      { wch: 30 },  // Email
      { wch: 15 },  // Rôle
      { wch: 35 },  // Formations
      { wch: 12 },  // Statut
      { wch: 15 }   // Date création
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    
    // Save file
    const filename = `utilisateurs_nectfy_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('Export Excel réalisé avec succès');
    onClose();
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToExcel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter la sélection</DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="text-sm text-muted-foreground">
            Exporter {users.length} utilisateur(s) sélectionné(s)
          </div>

          <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'pdf' | 'excel')}>
            <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50" 
                 onClick={() => setExportFormat('excel')}>
              <RadioGroupItem value="excel" id="excel" />
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <Label htmlFor="excel" className="font-medium cursor-pointer">Excel (.xlsx)</Label>
                  <p className="text-sm text-muted-foreground">Format professionnel avec colonnes alignées</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                 onClick={() => setExportFormat('pdf')}>
              <RadioGroupItem value="pdf" id="pdf" />
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <Label htmlFor="pdf" className="font-medium cursor-pointer">PDF</Label>
                  <p className="text-sm text-muted-foreground">Document prêt à imprimer avec branding NECTFY</p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleExport}>
            Exporter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportUsersModal;
