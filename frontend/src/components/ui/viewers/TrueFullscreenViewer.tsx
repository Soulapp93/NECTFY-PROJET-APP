import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut, 
  ChevronLeft, ChevronRight, Share2, Loader2, FileWarning
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useResolvedFileUrl } from '@/hooks/useResolvedFileUrl';
import AudioViewer from './AudioViewer';
import TextViewer from './TextViewer';
import ArchiveViewer from './ArchiveViewer';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { configurePdfJsWorker } from '@/lib/pdfWorker';

configurePdfJsWorker(pdfjs);

interface TrueFullscreenViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const TrueFullscreenViewer: React.FC<TrueFullscreenViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfPage, setPdfPage] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);

  const { resolvedUrl, isResolving } = useResolvedFileUrl(fileUrl, { enabled: isOpen });
  const effectiveUrl = resolvedUrl;

  const shouldWaitForSignedUrl =
    isOpen &&
    fileUrl.includes('/storage/v1/object/public/') &&
    effectiveUrl === fileUrl;

  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (extension: string) => {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const pdfExtensions = ['pdf'];
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
    const textExtensions = ['txt', 'md', 'markdown', 'log', 'json', 'xml', 'yaml', 'yml', 
                           'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
                           'css', 'scss', 'less', 'html', 'sh', 'bash', 'sql', 'php', 'rb', 
                           'go', 'rs', 'swift', 'csv'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
    
    if (pdfExtensions.includes(extension)) return 'pdf';
    if (videoExtensions.includes(extension)) return 'video';
    if (imageExtensions.includes(extension)) return 'image';
    if (officeExtensions.includes(extension)) return 'office';
    if (audioExtensions.includes(extension)) return 'audio';
    if (textExtensions.includes(extension)) return 'text';
    if (archiveExtensions.includes(extension)) return 'archive';
    return 'other';
  };

  const extension = getFileExtension(fileName);
  const fileType = getFileType(extension);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls in fullscreen mode
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    
    if (isFullscreen) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isFullscreen, resetControlsTimeout]);

  // Keyboard and open/close handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (fileType === 'pdf') {
        if (e.key === 'ArrowLeft') goToPrevPage();
        if (e.key === 'ArrowRight') goToNextPage();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setLoading(true);
      setError(false);
      setLoadProgress(0);
      if (fileType === 'pdf') {
        setPdfPages(0);
        setPdfPage(1);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, fileType, isFullscreen]);

  // Network probe + watchdog (avoid infinite loading)
  useEffect(() => {
    if (!isOpen) return;
    if (isResolving) return;
    if (shouldWaitForSignedUrl) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    if (watchdogRef.current) window.clearTimeout(watchdogRef.current);

    // Simulate progress
    const progressInterval = window.setInterval(() => {
      setLoadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    watchdogRef.current = window.setTimeout(() => {
      setLoading(false);
      setError(true);
      toast.error('Le fichier met trop de temps à charger.');
    }, 20000);

    fetch(effectiveUrl, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setLoadProgress(100);
      })
      .catch((e) => {
        console.error('File probe failed:', e);
        setLoading(false);
        setError(true);
        toast.error('Impossible de charger le fichier.');
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        window.clearInterval(progressInterval);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
      window.clearInterval(progressInterval);
      if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    };
  }, [isOpen, isResolving, shouldWaitForSignedUrl, effectiveUrl]);


  useEffect(() => {
    if (!isOpen) return;
    if (loading) return;
    if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
  }, [isOpen, loading]);

  // True fullscreen toggle using Fullscreen API
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast.error('Erreur mode plein écran');
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Exit fullscreen error:', err);
    }
  };

  const handleDownload = () => {
    fetch(effectiveUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Téléchargement démarré');
      })
      .catch(() => {
        window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
      });
  };

  const handleOpenNewTab = () => {
    window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(fileUrl).then(() => {
      toast.success('Lien copié dans le presse-papier');
    }).catch(() => {
      toast.error('Impossible de copier le lien');
    });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  
  const goToPrevPage = () => setPdfPage(p => Math.max(1, p - 1));
  const goToNextPage = () => setPdfPage(p => Math.min(pdfPages, p + 1));

  if (!isOpen) return null;

  // Use specialized viewers for specific file types
  if (fileType === 'audio') {
    return (
      <AudioViewer
        fileUrl={effectiveUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  if (fileType === 'text') {
    return (
      <TextViewer
        fileUrl={effectiveUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  if (fileType === 'archive') {
    return (
      <ArchiveViewer
        fileUrl={effectiveUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  const renderPdfContent = () => {
    const scale = zoom / 100;

    return (
      <div className="flex-1 w-full h-full bg-muted overflow-auto flex items-start justify-center p-4">
        <Document
          file={{ url: effectiveUrl }}
          onLoadSuccess={({ numPages }) => {
            setPdfPages(numPages);
            setLoading(false);
            setError(false);
          }}
          onLoadError={(e) => {
            console.error('PDF load error:', e);
            setLoading(false);
            setError(true);
          }}
          loading={null}
        >
          <Page
            pageNumber={pdfPage}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
            className="shadow-2xl rounded-lg"
            onRenderSuccess={() => setLoading(false)}
          />
        </Document>
      </div>
    );
  };

  const renderContent = () => {
    if (fileType === 'image') {
      return (
        <div className="flex-1 flex items-center justify-center overflow-auto p-2 bg-black/95">
          <img
            src={effectiveUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoom / 100})` }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            draggable={false}
          />
        </div>
      );
    }

    if (fileType === 'video') {
      return (
        <div className="flex-1 flex items-center justify-center bg-black p-2">
          <video
            src={effectiveUrl}
            controls
            autoPlay
            className="max-w-full max-h-full"
            onLoadedData={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </div>
      );
    }

    if (fileType === 'pdf') {
      return renderPdfContent();
    }

    if (fileType === 'office') {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(effectiveUrl)}`;
      return (
        <div className="flex-1 w-full h-full bg-muted">
          <iframe
            src={officeViewerUrl}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-card rounded-xl p-8 max-w-md w-full shadow-2xl border border-border">
          <FileWarning className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-6">
            Ce type de fichier ne peut pas être prévisualisé directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            <Button variant="outline" onClick={handleOpenNewTab} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
      onMouseMove={isFullscreen ? resetControlsTimeout : undefined}
      onTouchStart={isFullscreen ? resetControlsTimeout : undefined}
    >
      {/* Header - floating in fullscreen mode */}
      <div 
        className={`
          flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-sm shrink-0
          transition-all duration-300 ease-out
          ${isFullscreen ? 'absolute top-0 left-0 right-0 z-50' : ''}
          ${isFullscreen && !showControls ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}
        `}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={isFullscreen ? () => exitFullscreen().then(onClose) : onClose}
            className="shrink-0 h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{fileName}</span>
            {fileType === 'pdf' && pdfPages > 0 && (
              <span className="text-xs text-muted-foreground">
                Page {pdfPage} sur {pdfPages}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* PDF Navigation */}
          {fileType === 'pdf' && pdfPages > 1 && (
            <div className="hidden sm:flex items-center gap-1 mr-2 bg-muted/50 rounded-lg px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevPage}
                disabled={pdfPage <= 1}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center tabular-nums">
                {pdfPage}/{pdfPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextPage}
                disabled={pdfPage >= pdfPages}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Zoom controls */}
          {(fileType === 'image' || fileType === 'pdf') && !isMobile && (
            <div className="hidden sm:flex items-center gap-1 mr-2 bg-muted/50 rounded-lg px-2 py-1">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-7 w-7">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-7 w-7">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-9 w-9"
            title="Partager"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-9 w-9"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {!isMobile && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenNewTab}
                className="h-9 w-9"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant={isFullscreen ? "default" : "ghost"}
                size="icon"
                onClick={toggleFullscreen}
                className="h-9 w-9"
                title={isFullscreen ? "Quitter le plein écran (F ou Esc)" : "Plein écran (F)"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className={`flex-1 overflow-hidden relative ${isFullscreen ? 'pt-0' : ''}`}>
        {(loading || isResolving || shouldWaitForSignedUrl) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-foreground">Chargement...</span>
                {loadProgress > 0 && loadProgress < 100 && (
                  <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="bg-card rounded-xl p-8 max-w-md w-full shadow-2xl border border-border">
              <FileWarning className="h-16 w-16 mx-auto mb-4 text-destructive" />
              <p className="text-muted-foreground mb-6">
                Impossible de charger le fichier.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button variant="outline" onClick={handleOpenNewTab} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Mobile bottom navigation for PDFs */}
      {isMobile && fileType === 'pdf' && pdfPages > 1 && !loading && !error && (
        <div 
          className={`
            flex items-center justify-center gap-4 p-4 bg-background/95 backdrop-blur-sm border-t
            transition-all duration-300
            ${isFullscreen && !showControls ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}
          `}
        >
          <Button
            variant="outline"
            onClick={goToPrevPage}
            disabled={pdfPage <= 1}
            className="h-10 px-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Précédent
          </Button>
          <span className="text-sm font-medium tabular-nums px-3">
            {pdfPage} / {pdfPages}
          </span>
          <Button
            variant="outline"
            onClick={goToNextPage}
            disabled={pdfPage >= pdfPages}
            className="h-10 px-4"
          >
            Suivant
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Fullscreen hint */}
      {isFullscreen && showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
          Appuyez sur <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">Esc</kbd> pour quitter le plein écran
        </div>
      )}
    </div>
  );
};

export default TrueFullscreenViewer;
