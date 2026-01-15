import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../button';
import { toast } from 'sonner';

interface ModernFileViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ModernFileViewer: React.FC<ModernFileViewerProps> = ({
  fileUrl,
  fileName,
  isOpen,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gestion du mode plein écran
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

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen) return null;

  // Extraire l'extension du fichier
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const fileExtension = getFileExtension(fileName);

  // Fonction pour basculer le mode plein écran
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
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

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
    toast.info('Ouverture dans un nouvel onglet');
  };

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  // Fonction pour rendre le contenu selon le type de fichier
  const renderContent = () => {
    // PDF - Utiliser la visionneuse native du navigateur avec embed
    if (fileExtension === 'pdf') {
      return (
        <embed
          src={fileUrl}
          type="application/pdf"
          className="w-full h-full"
          title={fileName}
          onLoad={handleLoad}
          onError={handleError}
        />
      );
    }

    // Documents Office - Microsoft Office Online Viewer
    if (['pptx', 'ppt', 'xlsx', 'xls', 'docx', 'doc'].includes(fileExtension)) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      return (
        <iframe
          src={officeViewerUrl}
          className="border-0"
          title={fileName}
          onLoad={handleLoad}
          onError={handleError}
          style={{ 
            backgroundColor: '#525659',
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      );
    }

    // Vidéos - Balise HTML5 video
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(fileExtension)) {
      return (
        <div 
          className="flex items-center justify-center bg-[#525659]"
          style={{
            width: '100%',
            height: '100%',
            padding: isFullscreen ? '2rem' : '1rem'
          }}
        >
          <video
            src={fileUrl}
            controls
            preload="auto"
            className="max-w-full max-h-full"
            onLoadedData={handleLoad}
            onError={handleError}
            style={{ objectFit: 'contain' }}
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      );
    }

    // Images - Balise HTML5 img
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(fileExtension)) {
      return (
        <div 
          className="flex items-center justify-center bg-[#525659]"
          style={{
            width: '100%',
            height: '100%',
            padding: isFullscreen ? '2rem' : '1rem'
          }}
        >
          <img
            src={fileUrl}
            alt={fileName}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      );
    }

    // Format non supporté
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#525659] text-white p-8">
        <AlertCircle className="w-16 h-16 mb-4 text-orange-400" />
        <h3 className="text-xl font-medium mb-2">Format non supporté</h3>
        <p className="text-sm text-center mb-6 max-w-md text-gray-300">
          Ce format de fichier ({fileExtension.toUpperCase()}) ne peut pas être visualisé directement dans le navigateur.
        </p>
        <div className="flex space-x-3">
          <Button onClick={handleOpenInNewTab} variant="default" className="bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir dans un nouvel onglet
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#323639]"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0
      }}
    >
      {/* Barre d'outils */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-[#323639] border-b border-gray-700"
        style={{
          height: '48px',
          flexShrink: 0
        }}
      >
        <div className="flex items-center space-x-3">
          <h2 className="text-sm font-medium text-gray-200 truncate max-w-md">
            {fileName}
          </h2>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-medium">
            {fileExtension.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title={isFullscreen ? 'Quitter le plein écran (Échap)' : 'Plein écran (Ctrl+F)'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
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

          <div className="h-6 w-px bg-gray-600 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="Fermer (Échap)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone de contenu */}
      <div 
        style={{
          flex: 1,
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#525659] z-10">
            <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
            <div className="text-white text-lg">Chargement du document...</div>
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

export default ModernFileViewer;
