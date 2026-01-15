import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2, RotateCw, Menu, ChevronLeft, ChevronRight, Printer, ExternalLink, Loader2, FileWarning, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { configurePdfJsWorker } from '@/lib/pdfWorker';

// Configuration PDF.js worker: bundled/same-origin for reliability
configurePdfJsWorker(pdfjs);


interface ChromeStyleViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ChromeStyleViewer: React.FC<ChromeStyleViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch(e.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (pageNumber > 1) setPageNumber(pageNumber - 1);
          break;
        case 'ArrowRight':
          if (pageNumber < numPages) setPageNumber(pageNumber + 1);
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pageNumber, numPages, isFullscreen, onClose]);

  if (!isOpen) return null;

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (extension: string): 'pdf' | 'image' | 'video' | 'other' => {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
    const videoFormats = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'];

    if (extension === 'pdf') return 'pdf';
    if (imageFormats.includes(extension)) return 'image';
    if (videoFormats.includes(extension)) return 'video';
    return 'other';
  };

  const fileExtension = getFileExtension(fileName);
  const fileType = getFileType(fileExtension);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Erreur de chargement du PDF:', error);
    setError('Impossible de charger le document PDF');
    setLoading(false);
    toast.error('Erreur lors du chargement du document');
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Téléchargement démarré');
  };

  const handlePrint = () => {
    if (fileType === 'pdf' || fileType === 'image') {
      const printWindow = window.open(fileUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } else {
      toast.info('Impression non disponible pour ce type de fichier');
    }
  };

  const handleOpenNewTab = () => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    toast.success('Fichier ouvert dans un nouvel onglet');
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // Request fullscreen with all browser prefixes
        const elem = containerRef.current as any;
        
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        await exitFullscreen();
      }
    } catch (err) {
      console.error('Erreur fullscreen:', err);
      toast.error('Impossible de passer en plein écran');
    }
  };

  const exitFullscreen = async () => {
    try {
      const doc = document as any;
      
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    } catch (err) {
      console.error('Erreur sortie fullscreen:', err);
    }
  };

  const getZoomPercentage = () => {
    return Math.round(scale * 100);
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const renderPDFViewer = () => {
    return (
      <div className="flex h-full">
        {/* Sidebar with thumbnails */}
        {showThumbnails && (
          <div className="w-48 bg-[#3c3c3c] border-r border-gray-700 overflow-y-auto">
            <div className="p-2 space-y-2">
              {Array.from(new Array(numPages), (el, index) => (
                <div
                  key={`thumb_${index + 1}`}
                  onClick={() => setPageNumber(index + 1)}
                  className={`cursor-pointer p-1 rounded transition-all ${
                    pageNumber === index + 1
                      ? 'bg-blue-600 ring-2 ring-blue-400'
                      : 'bg-[#2c2c2c] hover:bg-[#404040]'
                  }`}
                >
                  <Document file={fileUrl} loading="">
                    <Page
                      pageNumber={index + 1}
                      width={160}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                  <div className="text-center text-xs text-gray-300 mt-1">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-auto bg-[#525659]" ref={contentRef}>
          <div 
            className="flex items-start justify-center min-h-full p-8"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease'
            }}
          >
            {error ? (
              <div className="flex flex-col items-center justify-center p-8 text-white">
                <FileWarning className="w-16 h-16 mb-4 text-red-400" />
                <div className="text-xl mb-2">Erreur de chargement</div>
                <div className="text-sm text-gray-400">{error}</div>
              </div>
            ) : (
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
                    <div className="text-white text-lg">Chargement du document...</div>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center p-8">
                    <FileWarning className="w-16 h-16 mb-4 text-red-400" />
                    <div className="text-red-400 text-lg">Erreur lors du chargement du PDF</div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={800}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-white mr-2" />
                      <div className="text-white">Chargement de la page...</div>
                    </div>
                  }
                  className="shadow-2xl"
                />
              </Document>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderImageViewer = () => {
    return (
      <div className="flex-1 overflow-auto bg-[#525659]">
        <div className="flex items-center justify-center min-h-full p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
          <img
            src={fileUrl}
            alt={fileName}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Impossible de charger l\'image');
              toast.error('Erreur lors du chargement de l\'image');
            }}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              maxWidth: '100%',
              height: 'auto',
              transition: 'transform 0.2s ease'
            }}
            className="shadow-2xl"
          />
        </div>
      </div>
    );
  };

  const renderVideoViewer = () => {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#525659] p-4">
        <div className="relative w-full max-w-5xl">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
          <video
            ref={videoRef}
            src={fileUrl}
            className="w-full rounded-lg shadow-2xl"
            controls
            onLoadedData={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError('Impossible de charger la vidéo');
              toast.error('Erreur lors du chargement de la vidéo');
            }}
            style={{
              transform: `scale(${scale})`,
              transition: 'transform 0.2s ease'
            }}
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      </div>
    );
  };

  const renderOtherViewer = () => {
    return (
      <div className="flex-1 bg-[#525659] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#525659]">
            <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
            <div className="text-white text-lg">Chargement du fichier...</div>
          </div>
        )}
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError('Impossible de charger ce type de fichier');
          }}
        />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#525659]">
            <FileWarning className="w-16 h-16 mb-4 text-red-400" />
            <div className="text-red-400 text-lg mb-4">{error}</div>
            <Button onClick={handleOpenNewTab} variant="outline">
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (fileType) {
      case 'pdf':
        return renderPDFViewer();
      case 'image':
        return renderImageViewer();
      case 'video':
        return renderVideoViewer();
      default:
        return renderOtherViewer();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-[#323639] ${isFullscreen ? 'fullscreen-container' : ''}`}
      ref={containerRef}
    >
      {/* Chrome-style toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#323639] border-b border-gray-700 flex-shrink-0">
        {/* Left side - File name and navigation */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-200 max-w-md truncate">
            {fileName}
          </div>
          
          {fileType === 'pdf' && !loading && !error && (
            <>
              <div className="h-6 w-px bg-gray-600" />
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={pageNumber}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= numPages) {
                        setPageNumber(page);
                      }
                    }}
                    className="w-12 h-7 px-2 text-center bg-[#2c2c2c] text-gray-200 border border-gray-600 rounded text-sm"
                    min={1}
                    max={numPages}
                  />
                  <span className="text-sm text-gray-400">/ {numPages}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                  disabled={pageNumber >= numPages}
                  className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls - Only for PDF, images, and videos */}
          {(fileType === 'pdf' || fileType === 'image' || fileType === 'video') && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                title="Zoom arrière"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="text-sm text-gray-300 min-w-[50px] text-center">
                {getZoomPercentage()}%
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
                title="Zoom avant"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="h-6 w-px bg-gray-600" />
            </>
          )}

          {/* Rotate - Only for PDF and images */}
          {(fileType === 'pdf' || fileType === 'image') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
              title="Rotation"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          )}

          {/* Thumbnails toggle (PDF only) */}
          {fileType === 'pdf' && !loading && !error && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`h-8 w-8 p-0 hover:bg-gray-700 ${
                showThumbnails ? 'text-blue-400' : 'text-gray-300 hover:text-white'
              }`}
              title="Miniatures"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}

          <div className="h-6 w-px bg-gray-600" />

          {/* Download */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Print */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Imprimer"
          >
            <Printer className="h-4 w-4" />
          </Button>

          {/* Open in new tab */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenNewTab}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Nouvel onglet"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Plein écran (F11 ou Ctrl+F)"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <div className="h-6 w-px bg-gray-600" />

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-300 hover:text-white hover:bg-gray-700"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default ChromeStyleViewer;