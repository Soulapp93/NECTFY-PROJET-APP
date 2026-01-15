import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, AlertCircle, Copy, CheckCheck, Video, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface LinkViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const LinkViewerModal: React.FC<LinkViewerModalProps> = ({
  isOpen,
  onClose,
  url,
  title
}) => {
  const [copied, setCopied] = useState(false);
  const [embedError, setEmbedError] = useState(false);

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setEmbedError(false);
    }
  }, [isOpen]);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  
  // Extraire l'ID de la vidéo YouTube
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(url);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  const handleDirectAccess = () => {
    // Créer un élément <a> temporaire pour contourner les restrictions
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isYouTube ? <Video className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Section principale avec miniature YouTube ou icône */}
          {isYouTube && thumbnailUrl ? (
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img 
                src={thumbnailUrl} 
                alt="Miniature vidéo YouTube" 
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="bg-red-600 rounded-full p-4">
                  <Video className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 rounded-lg bg-muted flex items-center justify-center">
              <Link2 className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Alert informatif */}
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              {isYouTube ? (
                <>
                  <strong>⚠️ Vidéo YouTube protégée</strong><br />
                  Cette vidéo ne peut pas être lue directement dans l'application. Vous devez la visionner sur YouTube.
                </>
              ) : (
                <>
                  <strong>🔗 Lien externe</strong><br />
                  Ce contenu doit être ouvert dans votre navigateur.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* URL avec fond */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Adresse du lien :</p>
            <p className="text-sm font-mono break-all text-foreground select-all">{url}</p>
          </div>

          {/* Boutons d'action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              size="lg" 
              onClick={handleCopyLink}
              variant="default"
              className="w-full"
            >
              {copied ? (
                <>
                  <CheckCheck className="h-5 w-5 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Copier le lien
                </>
              )}
            </Button>

            <Button 
              size="lg" 
              onClick={handleDirectAccess}
              variant="secondary"
              className="w-full"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Ouvrir le lien
            </Button>
          </div>

          {/* Instructions - Plus visibles */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-300 dark:border-blue-700 p-5 rounded-xl shadow-sm">
            <h4 className="font-bold text-base mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <span className="text-2xl">👆</span>
              Marche à suivre :
            </h4>
            <ol className="text-sm text-blue-900 dark:text-blue-100 space-y-2.5">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                <span className="pt-0.5">Cliquez sur le bouton violet <strong>"Copier le lien"</strong> ci-dessus</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                <span className="pt-0.5">Ouvrez un <strong>nouvel onglet</strong> dans votre navigateur</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</span>
                <span className="pt-0.5">Collez le lien dans la barre d'adresse (<kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border">Ctrl+V</kbd> ou <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border">Cmd+V</kbd>)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">4</span>
                <span className="pt-0.5">Appuyez sur <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border">Entrée</kbd> pour accéder au contenu</span>
              </li>
            </ol>
          </div>

          {isYouTube && (
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Cette restriction est imposée par le propriétaire de la vidéo YouTube, pas par cette plateforme.
              </p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                ℹ️ Le bouton "Ouvrir le lien" peut ne pas fonctionner à cause des protections du navigateur. Utilisez la méthode de copie ci-dessus.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkViewerModal;
