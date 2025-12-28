import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut, 
  ChevronLeft, ChevronRight, Share2, Loader2, FileWarning, RotateCcw, AlertTriangle,
  RotateCw, RefreshCw, Grid3X3, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useResolvedFileUrl } from '@/hooks/useResolvedFileUrl';
import PDFViewerPro from './PDFViewerPro';
import AudioViewer from './AudioViewer';
import TextViewer from './TextViewer';
import ArchiveViewer from './ArchiveViewer';
import { useImageTransform } from './hooks/useImageTransform';
import AnnotationLayer from './components/AnnotationLayer';
import PDFThumbnailNav from './components/PDFThumbnailNav';

// Utility to detect iOS WebKit
const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

interface ProductionFileViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

type FileType = 'pdf' | 'image' | 'video' | 'audio' | 'office' | 'text' | 'archive' | 'other';

const getFileExtension = (name: string): string => {
  return name.split('.').pop()?.toLowerCase() || '';
};

const getFileType = (extension: string): FileType => {
  const typeMap: Record<string, FileType> = {
    // PDF
    pdf: 'pdf',
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', 
    bmp: 'image', svg: 'image', webp: 'image', heic: 'image',
    // Video
    mp4: 'video', webm: 'video', ogg: 'video', mov: 'video', avi: 'video', mkv: 'video',
    // Audio
    mp3: 'audio', wav: 'audio', aac: 'audio', flac: 'audio', m4a: 'audio', wma: 'audio',
    // Office
    doc: 'office', docx: 'office', xls: 'office', xlsx: 'office', ppt: 'office', pptx: 'office',
    // Text/Code
    txt: 'text', md: 'text', markdown: 'text', log: 'text', json: 'text', xml: 'text',
    yaml: 'text', yml: 'text', js: 'text', jsx: 'text', ts: 'text', tsx: 'text',
    py: 'text', java: 'text', c: 'text', cpp: 'text', h: 'text', hpp: 'text',
    css: 'text', scss: 'text', less: 'text', html: 'text', sh: 'text', bash: 'text',
    sql: 'text', php: 'text', rb: 'text', go: 'text', rs: 'text', swift: 'text', csv: 'text',
    // Archive
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  };
  return typeMap[extension] || 'other';
};

const ProductionFileViewer: React.FC<ProductionFileViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPages, setPdfPages] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { resolvedUrl, isResolving, resolveError } = useResolvedFileUrl(fileUrl, { 
    enabled: isOpen,
    expiresInSeconds: 60 * 30 // 30 minutes for production
  });

  const extension = useMemo(() => getFileExtension(fileName), [fileName]);
  const fileType = useMemo(() => getFileType(extension), [extension]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setZoom(100);
      setPdfPage(1);
      setPdfPages(0);
      setLoadProgress(0);
      setRetryCount(0);
      setImageRotation(0);
      setShowThumbnails(false);
      setShowAnnotations(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle URL resolution errors
  useEffect(() => {
    if (resolveError && isOpen) {
      setError(`Impossible de récupérer le fichier: ${resolveError}`);
      setLoading(false);
    }
  }, [resolveError, isOpen]);

  // Simulate loading progress
  useEffect(() => {
    if (!isOpen || !loading) return;
    
    const interval = setInterval(() => {
      setLoadProgress(prev => Math.min(prev + 5, 90));
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen, loading]);

  // Fullscreen handling
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

  // Auto-hide controls in fullscreen
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
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
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isFullscreen, resetControlsTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (fileType === 'pdf') {
        if (e.key === 'ArrowLeft') setPdfPage(p => Math.max(1, p - 1));
        if (e.key === 'ArrowRight') setPdfPage(p => Math.min(pdfPages, p + 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, fileType, pdfPages, onClose]);

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
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(resolvedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Téléchargement démarré');
    } catch {
      window.open(resolvedUrl, '_blank');
    }
  };

  const handleOpenNewTab = () => {
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(fileUrl).then(() => {
      toast.success('Lien copié');
    }).catch(() => {
      toast.error('Impossible de copier');
    });
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setLoadProgress(0);
    setRetryCount(prev => prev + 1);
  };

  const handleLoadSuccess = () => {
    setLoading(false);
    setError(null);
    setLoadProgress(100);
  };

  const handleLoadError = (errorMsg: string) => {
    setLoading(false);
    setError(errorMsg);
  };

  if (!isOpen) return null;

  // Delegate to specialized viewers
  if (fileType === 'audio') {
    return (
      <AudioViewer
        fileUrl={resolvedUrl}
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
        fileUrl={resolvedUrl}
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
        fileUrl={resolvedUrl}
        fileName={fileName}
        isOpen={isOpen}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  // Content renderers
  const renderImageContent = () => {
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    
    return (
      <div 
        ref={contentRef}
        className="flex-1 flex items-center justify-center overflow-hidden p-2 bg-black/95 relative touch-none"
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            e.preventDefault();
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2) {
            e.preventDefault();
            // Pinch to zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
              touch2.clientX - touch1.clientX,
              touch2.clientY - touch1.clientY
            );
            // Simplified pinch zoom
            if ((window as any)._lastPinchDistance) {
              const delta = distance - (window as any)._lastPinchDistance;
              setZoom(z => Math.max(25, Math.min(300, z + delta * 0.5)));
            }
            (window as any)._lastPinchDistance = distance;
          }
        }}
        onTouchEnd={() => {
          (window as any)._lastPinchDistance = null;
        }}
      >
        <img
          key={retryCount}
          src={resolvedUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain transition-transform duration-200 select-none pointer-events-none"
          style={{ 
            transform: `scale(${zoom / 100}) rotate(${imageRotation}deg)`,
            transformOrigin: 'center center'
          }}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            handleLoadSuccess();
          }}
          onError={() => handleLoadError('Impossible de charger l\'image')}
          draggable={false}
        />
        
        {/* Annotation overlay */}
        {showAnnotations && imageDimensions.width > 0 && (
          <AnnotationLayer
            isActive={showAnnotations}
            onToggle={() => setShowAnnotations(false)}
            width={contentRef.current?.clientWidth || 800}
            height={contentRef.current?.clientHeight || 600}
            onSave={(dataUrl) => {
              toast.success('Annotations sauvegardées');
              setShowAnnotations(false);
            }}
          />
        )}
      </div>
    );
  };

  const renderVideoContent = () => (
    <div className="flex-1 flex items-center justify-center bg-black p-2">
      <video
        key={retryCount}
        src={resolvedUrl}
        controls
        autoPlay
        playsInline
        className="max-w-full max-h-full"
        onLoadedData={handleLoadSuccess}
        onError={() => handleLoadError('Impossible de lire la vidéo')}
      />
    </div>
  );

  const renderPdfContent = () => (
    <div className="flex-1 flex relative">
      {/* Thumbnail sidebar for desktop */}
      {!isMobile && pdfPages > 1 && (
        <PDFThumbnailNav
          fileUrl={resolvedUrl}
          numPages={pdfPages}
          currentPage={pdfPage}
          onPageChange={setPdfPage}
          isOpen={showThumbnails}
          onToggle={() => setShowThumbnails(!showThumbnails)}
        />
      )}
      
      <div className="flex-1 relative" ref={contentRef}>
        <PDFViewerPro
          fileUrl={resolvedUrl}
          zoom={zoom}
          page={pdfPage}
          onPageChange={setPdfPage}
          onPagesLoaded={(numPages) => {
            setPdfPages(numPages);
            handleLoadSuccess();
          }}
          onError={(msg) => handleLoadError(msg)}
          retryKey={retryCount}
        />
        
        {/* Annotation overlay for PDF */}
        {showAnnotations && (
          <AnnotationLayer
            isActive={showAnnotations}
            onToggle={() => setShowAnnotations(false)}
            width={contentRef.current?.clientWidth || 800}
            height={contentRef.current?.clientHeight || 600}
            onSave={(dataUrl) => {
              toast.success('Annotations sauvegardées');
              setShowAnnotations(false);
            }}
          />
        )}
      </div>
    </div>
  );

  const renderOfficeContent = () => {
    // Office Online viewer requires publicly accessible URL
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolvedUrl)}`;
    return (
      <div className="flex-1 w-full h-full bg-muted">
        <iframe
          key={retryCount}
          src={officeViewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={handleLoadSuccess}
          onError={() => handleLoadError('Impossible de charger le document Office')}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  };

  const renderOtherContent = () => (
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

  const renderContent = () => {
    if (isResolving) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Préparation du fichier...</p>
          </div>
        </div>
      );
    }

    switch (fileType) {
      case 'image': return renderImageContent();
      case 'video': return renderVideoContent();
      case 'pdf': return renderPdfContent();
      case 'office': return renderOfficeContent();
      default: return renderOtherContent();
    }
  };

  const renderErrorState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="bg-card rounded-xl p-8 max-w-md w-full shadow-2xl border border-destructive/30 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRetry} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
          <Button variant="outline" onClick={handleOpenNewTab} className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir dans un nouvel onglet
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
      onMouseMove={isFullscreen ? resetControlsTimeout : undefined}
      onTouchStart={isFullscreen ? resetControlsTimeout : undefined}
    >
      {/* Header */}
      <header 
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
            onClick={() => {
              if (isFullscreen) document.exitFullscreen?.().finally(onClose);
              else onClose();
            }}
            className="shrink-0 h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{fileName}</span>
            {fileType === 'pdf' && pdfPages > 0 && (
              <span className="text-xs text-muted-foreground">
                Page {pdfPage} / {pdfPages}
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
                onClick={() => setPdfPage(p => Math.max(1, p - 1))}
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
                onClick={() => setPdfPage(p => Math.min(pdfPages, p + 1))}
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setZoom(z => Math.max(25, z - 25))} 
                className="h-7 w-7"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setZoom(z => Math.min(300, z + 25))} 
                className="h-7 w-7"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Rotation for images */}
          {fileType === 'image' && !isMobile && (
            <div className="hidden sm:flex items-center gap-1 mr-2 bg-muted/50 rounded-lg px-1 py-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setImageRotation(r => (r - 90) % 360)} 
                className="h-7 w-7"
                title="Rotation gauche"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setImageRotation(r => (r + 90) % 360)} 
                className="h-7 w-7"
                title="Rotation droite"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Thumbnails toggle for PDF */}
          {fileType === 'pdf' && pdfPages > 1 && !isMobile && (
            <Button 
              variant={showThumbnails ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setShowThumbnails(!showThumbnails)} 
              className="h-9 w-9"
              title="Miniatures"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          )}

          {/* Annotations toggle */}
          {(fileType === 'image' || fileType === 'pdf') && (
            <Button 
              variant={showAnnotations ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setShowAnnotations(!showAnnotations)} 
              className="h-9 w-9"
              title="Annotations"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          {/* Actions */}
          <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-9 w-9">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </header>

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground mb-2">Chargement en cours...</p>
          <div className="w-48">
            <Progress value={loadProgress} className="h-2" />
          </div>
        </div>
      )}

      {/* Main content */}
      {error ? renderErrorState() : renderContent()}

      {/* Mobile PDF controls */}
      {fileType === 'pdf' && pdfPages > 1 && isMobile && !error && (
        <div 
          className={`
            absolute bottom-4 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border
            transition-all duration-300
            ${isFullscreen && !showControls ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}
          `}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPdfPage(p => Math.max(1, p - 1))}
            disabled={pdfPage <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium w-16 text-center tabular-nums">
            {pdfPage} / {pdfPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPdfPage(p => Math.min(pdfPages, p + 1))}
            disabled={pdfPage >= pdfPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductionFileViewer;
