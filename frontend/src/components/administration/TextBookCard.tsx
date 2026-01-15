import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookText, Download, Archive } from 'lucide-react';
import { TextBook, TextBookEntry, textBookService } from '@/services/textBookService';
import { pdfExportService } from '@/services/pdfExportService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TextBookCardProps {
  textBook: TextBook;
  onUpdate: () => void;
}

const TextBookCard: React.FC<TextBookCardProps> = ({ textBook, onUpdate }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TextBookEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOrientationModal, setShowOrientationModal] = useState(false);
  const [selectedOrientation, setSelectedOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const entriesData = await textBookService.getTextBookEntries(textBook.id);
        setEntries((entriesData as TextBookEntry[]) || []);
      } catch (error) {
        console.error('Erreur lors du chargement des entrées:', error);
      }
    };

    fetchEntries();
  }, [textBook.id]);

  const handleOpenTextBook = () => {
    navigate(`/cahier-texte/${textBook.id}?from=administration`);
  };

  const handleOpenExportModal = () => {
    setSelectedOrientation('portrait');
    setShowOrientationModal(true);
  };

  const handleExportPDF = async () => {
    setShowOrientationModal(false);
    setLoading(true);
    try {
      await pdfExportService.exportTextBookToPDF(textBook, entries, selectedOrientation);
      toast({
        title: "Export réussi",
        description: "Le cahier de texte a été exporté en PDF.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le cahier de texte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      await textBookService.archiveTextBook(textBook.id);
      toast({
        title: "Archivage réussi",
        description: "Le cahier de texte a été archivé.",
      });
      onUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le cahier de texte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Header avec couleur de la formation */}
        <div 
          className="p-4 text-white"
          style={{ 
            background: `linear-gradient(135deg, ${textBook.formations?.color || '#8B5CF6'}, ${textBook.formations?.color || '#8B5CF6'}cc)`
          }}
        >
          <div className="space-y-2">
            <h3 className="text-base font-semibold">
              Cahier de texte - {textBook.formations?.title || 'Formation'}
            </h3>
            <div className="text-sm opacity-90">
              {textBook.formations?.title || 'Formation'}
            </div>
            <div className="text-sm opacity-90">
              Année {textBook.academic_year}
            </div>
            <div className="text-sm font-medium">
              {entries.length} entrée{entries.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Content avec les boutons */}
        <CardContent className="p-4 space-y-2">
          <Button 
            onClick={handleOpenTextBook}
            className="w-full justify-start text-sm"
            variant="outline"
            disabled={loading}
            size="sm"
          >
            <BookText className="h-4 w-4 mr-2" />
            Ouvrir
          </Button>

          <Button 
            onClick={handleOpenExportModal}
            className="w-full justify-start text-sm"
            variant="outline"
            disabled={loading}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>

          <Button 
            onClick={handleArchive}
            className="w-full justify-start text-sm"
            variant="outline"
            disabled={loading}
            size="sm"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archiver
          </Button>
        </CardContent>
      </Card>

      {/* Modal de choix d'orientation */}
      <Dialog open={showOrientationModal} onOpenChange={setShowOrientationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exporter le cahier de texte</DialogTitle>
            <DialogDescription>
              Choisissez l'orientation du document PDF
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup 
              value={selectedOrientation} 
              onValueChange={(value) => setSelectedOrientation(value as 'portrait' | 'landscape')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="flex-1 cursor-pointer">
                  <div className="font-medium">Portrait</div>
                  <div className="text-sm text-muted-foreground">Format vertical (A4)</div>
                </Label>
                <div className="w-6 h-8 border-2 border-primary rounded" />
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="flex-1 cursor-pointer">
                  <div className="font-medium">Paysage</div>
                  <div className="text-sm text-muted-foreground">Format horizontal (A4)</div>
                </Label>
                <div className="w-8 h-6 border-2 border-primary rounded" />
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowOrientationModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleExportPDF} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TextBookCard;