import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, RefreshCw, AlertCircle, Eye, Maximize2, Presentation, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { Button } from '../button';
import { toast } from 'sonner';
import { useResolvedFileUrl } from '@/hooks/useResolvedFileUrl';

interface UniversalFileViewerProps {
  fileUrl: string;
  fileName: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
}

const UniversalFileViewer: React.FC<UniversalFileViewerProps> = ({
  fileUrl,
  fileName,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
  isPresentationMode = false,
  onTogglePresentationMode
}) => {
  const { resolvedUrl, isResolving, resolveError } = useResolvedFileUrl(fileUrl);
  const effectiveUrl = resolvedUrl;

  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerMethod, setViewerMethod] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  const getViewerOptions = () => {
    const encodedUrl = encodeURIComponent(effectiveUrl);
    
    if (fileExtension === 'pdf') {
      return [
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google'
        },
        {
          name: 'Mozilla PDF.js',
          url: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`,
          description: 'Visualiseur PDF.js'
        },
        {
          name: 'Iframe Direct',
          url: effectiveUrl,
          description: 'Chargement direct'
        }
      ];
    }

    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
      return [
        {
          name: 'Office Online',
          url: `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`,
          description: 'Office Online Viewer'
        },
        {
          name: 'Google Docs Viewer',
          url: `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`,
          description: 'Visualiseur Google'
        }
      ];
    }

    // Pour les autres types de fichiers (images, etc.)
    return [
      {
        name: 'Direct View',
        url: effectiveUrl,
        description: 'Affichage direct'
      }
    ];
  };

  const viewerOptions = getViewerOptions();
  const currentViewer = viewerOptions[viewerMethod];

  const handleIframeLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
    console.error(`Erreur de chargement avec ${currentViewer.name}`);
  };

  const handleRetry = () => {
    if (viewerMethod < viewerOptions.length - 1) {
      setViewerMethod(viewerMethod + 1);
      setIsLoading(true);
      setLoadError(false);
      setRetryCount(retryCount + 1);
      toast.info(`Tentative avec ${viewerOptions[viewerMethod + 1].name}...`);
    } else {
      // Reset to first method
      setViewerMethod(0);
      setIsLoading(true);
      setLoadError(false);
      setRetryCount(retryCount + 1);
      toast.info('Nouvelle tentative...');
    }
  };

  const handleDownload = async () => {
    try {
      // Télécharger le fichier via fetch pour éviter les problèmes CORS
      const response = await fetch(effectiveUrl);
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      
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

  const handleShare = async () => {
    try {
      // Vérifier si l'API Web Share est disponible
      if (navigator.share) {
        // Télécharger le fichier pour le partager
        const response = await fetch(effectiveUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });
        
        await navigator.share({
          title: fileName,
          files: [file],
        });
        toast.success('Fichier partagé');
      } else {
        // Fallback: copier le lien dans le presse-papiers
        await navigator.clipboard.writeText(fileUrl);
        toast.success('Lien copié dans le presse-papiers');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erreur de partage:', error);
        // Fallback: copier le lien
        try {
          await navigator.clipboard.writeText(fileUrl);
          toast.success('Lien copié dans le presse-papiers');
        } catch {
          toast.error('Impossible de partager le fichier');
        }
      }
    }
  };

  const openInNewTab = async () => {
    try {
      // Utiliser fetch pour télécharger et ouvrir dans un nouvel onglet via un lien <a>
      const response = await fetch(effectiveUrl);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ouverture');
      }
      
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
      // Nettoyer l'URL après un délai pour permettre au navigateur de charger
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Erreur d\'ouverture:', error);
      toast.error('Impossible d\'ouvrir le fichier - Essayez de le télécharger');
    }
  };

  const getFileTypeColor = () => {
    switch (fileExtension) {
      case 'pdf': return 'bg-red-100 text-red-700 border-red-200';
      case 'doc':
      case 'docx': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ppt':
      case 'pptx': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'xls':
      case 'xlsx': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'xls':
      case 'xlsx': return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      default: return '📎';
    }
  };

  // Reset viewer method when file changes
  useEffect(() => {
    setViewerMethod(0);
    setIsLoading(true);
    setLoadError(false);
    setRetryCount(0);
  }, [effectiveUrl]);

  // If URL resolution fails (private buckets, expired links, etc.), fail fast instead of crashing/looping.
  useEffect(() => {
    if (!resolveError) return;
    setIsLoading(false);
    setLoadError(true);
    toast.error('Impossible de charger le fichier (accès refusé ou lien expiré).');
  }, [resolveError]);

  // Auto-hide controls in presentation mode
  useEffect(() => {
    if (isPresentationMode) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(timer);
        setTimeout(() => setShowControls(false), 3000);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timer);
      };
    } else {
      setShowControls(true);
    }
  }, [isPresentationMode]);

  return (
    <div className={`h-full w-full flex flex-col ${isPresentationMode ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 transition-opacity duration-300 ${
        isPresentationMode && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon()}</span>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-md">{fileName}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded border ${getFileTypeColor()}`}>
                {fileExtension.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {currentViewer.description}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation for PDFs */}
          {fileExtension === 'pdf' && (
            <>
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm px-2">Page {currentPage}</span>
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2"
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-gray-300 mx-2" />
            </>
          )}

          {loadError && viewerOptions.length > 1 && (
            <button 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              onClick={handleRetry}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Réessayer
            </button>
          )}
          
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-8 px-3"
            onClick={openInNewTab}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Nouvel onglet
          </button>
          
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            Télécharger
          </button>
          
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Partager
          </button>

          {onTogglePresentationMode && (
            <button 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              onClick={onTogglePresentationMode}
            >
              <Presentation className="h-4 w-4 mr-1" />
              Présentation
            </button>
          )}
          
          {onToggleFullscreen && (
            <button 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
              onClick={onToggleFullscreen}
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Plein écran
            </button>
          )}
          
          {onClose && (
            <button 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 relative ${isPresentationMode ? 'bg-black' : 'bg-gray-100'}`}>
        {(isLoading || isResolving) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-gray-600">Chargement du document...</p>
            <p className="text-xs text-gray-500 mt-1">Méthode: {currentViewer.name}</p>
          </div>
        )}

        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Impossible de charger le document
            </h3>
            <p className="text-gray-600 mb-4 max-w-md">
              Le document ne peut pas être affiché dans le navigateur. 
              Cela peut être dû aux paramètres de sécurité du fichier.
            </p>
            
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-3">
                <Button onClick={handleDownload} variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le fichier
                </Button>
                <Button onClick={openInNewTab} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans un nouvel onglet
                </Button>
              </div>
              
              {viewerOptions.length > 1 && (
                <Button onClick={handleRetry} variant="ghost">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Essayer une autre méthode ({viewerMethod + 1}/{viewerOptions.length})
                </Button>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg max-w-md">
              <p className="text-sm text-blue-800">
                <strong>Conseil :</strong> Pour une meilleure expérience, 
                téléchargez le fichier et ouvrez-le avec l'application appropriée.
              </p>
            </div>
          </div>
        ) : (
          <>
            <iframe
              src={currentViewer.url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="fullscreen"
              title={fileName}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
            
            {/* Floating controls for presentation mode */}
            {isPresentationMode && showControls && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-full px-4 py-2 flex items-center space-x-2 backdrop-blur-sm">
                {fileExtension === 'pdf' && (
                  <>
                    <button 
                      className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-white text-sm px-2">Page {currentPage}</span>
                    <button 
                      className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="h-4 w-px bg-white/30 mx-2" />
                  </>
                )}
                <button 
                  className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                  onClick={openInNewTab}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button 
                  className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                </button>
                {onClose && (
                  <button 
                    className="inline-flex items-center justify-center h-8 px-2 text-white hover:bg-white/20 rounded"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UniversalFileViewer;