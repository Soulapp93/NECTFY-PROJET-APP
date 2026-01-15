import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, ChevronLeft, ChevronRight, Sidebar, AlignHorizontalJustifyCenter, FileText, ExternalLink } from 'lucide-react';
import { Button } from '../button';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { configurePdfJsWorker } from '@/lib/pdfWorker';

// Configure PDF.js worker: bundled/same-origin for reliability
configurePdfJsWorker(pdfjsLib);


interface ChromeStylePDFViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

type FitMode = 'page' | 'width' | 'auto';

const ChromeStylePDFViewer: React.FC<ChromeStylePDFViewerProps> = ({
  fileUrl,
  fileName,
  onClose
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [fitMode, setFitMode] = useState<FitMode>('page');
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        
        // Generate thumbnails
        const thumbs: string[] = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            thumbs.push(canvas.toDataURL());
          }
        }
        setThumbnails(thumbs);
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast.error('Erreur lors du chargement du PDF');
        setLoading(false);
      }
    };

    loadPdf();
  }, [fileUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        let viewport = page.getViewport({ scale: 1, rotation });

        // Calculate scale based on fit mode
        if (fitMode === 'width' && scrollContainerRef.current) {
          const containerWidth = scrollContainerRef.current.clientWidth - 40;
          const scaleToFit = containerWidth / viewport.width;
          viewport = page.getViewport({ scale: scaleToFit * scale, rotation });
        } else if (fitMode === 'page' && scrollContainerRef.current) {
          const containerWidth = scrollContainerRef.current.clientWidth - 40;
          const containerHeight = scrollContainerRef.current.clientHeight - 40;
          const scaleWidth = containerWidth / viewport.width;
          const scaleHeight = containerHeight / viewport.height;
          const scaleToFit = Math.min(scaleWidth, scaleHeight);
          viewport = page.getViewport({ scale: scaleToFit * scale, rotation });
        } else {
          viewport = page.getViewport({ scale, rotation });
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport
        }).promise;
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, rotation, fitMode]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, isFullscreen]);

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
    setFitMode('auto');
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
    setFitMode('auto');
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Téléchargement démarré');
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      toast.error('Impossible de télécharger le fichier');
    }
  };

  const openInNewTab = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur lors de l\'ouverture');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Fichier ouvert dans un nouvel onglet');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Erreur d\'ouverture:', error);
      toast.error('Impossible d\'ouvrir le fichier');
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast.error('Erreur mode plein écran');
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  };

  const handleFitWidth = () => {
    setFitMode('width');
    setScale(1.0);
  };

  const handleFitPage = () => {
    setFitMode('page');
    setScale(1.0);
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#525659] flex flex-col"
    >
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#323639] border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Afficher/Masquer miniatures"
          >
            <Sidebar className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-medium text-gray-200 truncate max-w-md">
            {fileName}
          </h2>
        </div>

        <div className="flex items-center space-x-1">
          {/* Page Navigation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            <input
              type="number"
              value={currentPage}
              onChange={handlePageInput}
              className="w-12 px-2 py-1 text-sm text-center bg-gray-700 text-white rounded border-none focus:ring-1 focus:ring-blue-500"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-gray-400">/ {totalPages}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-600 mx-2" />

          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Zoom arrière (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-300 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Zoom avant (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-600 mx-2" />

          {/* Fit Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitWidth}
            className={`text-gray-300 hover:text-white hover:bg-gray-700 ${fitMode === 'width' ? 'bg-gray-700' : ''}`}
            title="Ajuster à la largeur"
          >
            <AlignHorizontalJustifyCenter className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitPage}
            className={`text-gray-300 hover:text-white hover:bg-gray-700 ${fitMode === 'page' ? 'bg-gray-700' : ''}`}
            title="Ajuster à la page"
          >
            <FileText className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-600 mx-2" />

          {/* Other Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Rotation"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <div className="h-6 w-px bg-gray-600 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Thumbnails */}
        {showSidebar && (
          <div className="w-48 bg-[#424242] border-r border-gray-700 overflow-y-auto">
            <div className="p-2 space-y-2">
              {thumbnails.map((thumb, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-full p-2 rounded transition-colors ${
                    currentPage === index + 1
                      ? 'bg-blue-600 ring-2 ring-blue-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <img
                    src={thumb}
                    alt={`Page ${index + 1}`}
                    className="w-full h-auto border border-gray-600"
                  />
                  <p className="text-xs text-white text-center mt-1">
                    {index + 1}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PDF Canvas Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto bg-[#525659] flex items-center justify-center p-4"
        >
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Chargement du PDF...</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="shadow-2xl bg-white"
              style={{ display: 'block' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChromeStylePDFViewer;
