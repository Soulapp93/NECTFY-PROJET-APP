import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, BookText, Grid, List, Download, Archive, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import CreateTextBookModal from './CreateTextBookModal';
import TextBookCard from './TextBookCard';
import { textBookService, TextBook } from '@/services/textBookService';
import { formationService } from '@/services/formationService';
import { useToast } from '@/hooks/use-toast';


const TextBooksList: React.FC = () => {
  const [textBooks, setTextBooks] = useState<TextBook[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormation, setSelectedFormation] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTextBookForExport, setSelectedTextBookForExport] = useState<TextBook | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  

  const fetchData = async () => {
    try {
      setLoading(true);
      const [textBooksData, formationsData] = await Promise.all([
        textBookService.getTextBooks(),
        formationService.getFormations()
      ]);
      setTextBooks(textBooksData || []);
      setFormations(formationsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique years from textbooks
  const uniqueYears = [...new Set(textBooks.map(tb => tb.academic_year))].sort().reverse();

  const filteredTextBooks = textBooks.filter(textBook => {
    // Search filter
    const matchesSearch = !searchTerm || 
      textBook.formations?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      textBook.academic_year.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Formation filter
    const matchesFormation = selectedFormation === 'all' || 
      textBook.formation_id === selectedFormation;
    
    // Year filter
    const matchesYear = selectedYear === 'all' || 
      textBook.academic_year === selectedYear;
    
    return matchesSearch && matchesFormation && matchesYear;
  });

  const handleCreateSuccess = () => {
    fetchData();
  };

  const openExportModal = (textBook: TextBook) => {
    setSelectedTextBookForExport(textBook);
    setIsExportModalOpen(true);
  };

  const handleExportPDF = async (orientation: 'portrait' | 'landscape') => {
    if (!selectedTextBookForExport) return;
    
    try {
      const { pdfExportService } = await import('@/services/pdfExportService');
      const entries = await textBookService.getTextBookEntries(selectedTextBookForExport.id);
      await pdfExportService.exportTextBookToPDF(selectedTextBookForExport, entries || [], orientation);
      toast({
        title: "Export réussi",
        description: "Le cahier de texte a été exporté en PDF.",
      });
      setIsExportModalOpen(false);
      setSelectedTextBookForExport(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le cahier de texte.",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (textBookId: string) => {
    try {
      await textBookService.archiveTextBook(textBookId);
      toast({
        title: "Archivage réussi",
        description: "Le cahier de texte a été archivé.",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le cahier de texte.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement des cahiers de texte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <BookText className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Gestion des Cahiers de Texte</h2>
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          {/* View mode toggle */}
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')} className="w-auto">
            <TabsList>
              <TabsTrigger value="grid" className="px-2 sm:px-3">
                <Grid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2 sm:px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm" size="sm">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Créer un Cahier de texte</span>
            <span className="sm:hidden">Créer</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Recherche par mot (titre, formation)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3 flex-wrap">
          <Select value={selectedFormation} onValueChange={setSelectedFormation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
              {formations.map((formation) => (
                <SelectItem key={formation.id} value={formation.id}>
                  {formation.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Toutes années" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes années</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {filteredTextBooks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookText className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedFormation !== 'all' || selectedYear !== 'all' 
                ? 'Aucun cahier de texte trouvé' 
                : 'Aucun cahier de texte'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedFormation !== 'all' || selectedYear !== 'all'
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Commencez par créer votre premier cahier de texte pour une formation.'
              }
            </p>
            {!searchTerm && selectedFormation === 'all' && selectedYear === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier cahier de texte
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTextBooks.map((textBook) => (
            <TextBookCard
              key={textBook.id}
              textBook={textBook}
              onUpdate={fetchData}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredTextBooks.map((textBook) => (
              <div key={textBook.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-8 rounded"
                      style={{ backgroundColor: textBook.formations?.color || '#8B5CF6' }}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Cahier de texte - {textBook.formations?.title || 'Formation'}
                      </h3>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>Année {textBook.academic_year}</span>
                        <span>Formation: {textBook.formations?.title || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={() => navigate(`/cahier-texte/${textBook.id}`)}
                      variant="outline" 
                      size="sm"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Ouvrir
                    </Button>
                    <Button 
                      onClick={() => openExportModal(textBook)}
                      variant="outline" 
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => handleArchive(textBook.id)}
                      variant="outline" 
                      size="sm"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateTextBookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Export PDF Modal with orientation selection */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exporter en PDF</DialogTitle>
            <DialogDescription>
              Choisissez l'orientation du document PDF
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-purple-500 hover:bg-purple-50"
              onClick={() => handleExportPDF('portrait')}
            >
              <div className="w-8 h-12 border-2 border-current rounded" />
              <span>Portrait</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2 border-2 hover:border-purple-500 hover:bg-purple-50"
              onClick={() => handleExportPDF('landscape')}
            >
              <div className="w-12 h-8 border-2 border-current rounded" />
              <span>Paysage</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TextBooksList;