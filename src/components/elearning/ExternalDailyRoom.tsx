import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ExternalLink, 
  PhoneOff, 
  Loader2, 
  AlertCircle,
  Video,
  Users,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { createDailyRoom, createDailyToken, generateRoomName } from '@/services/dailyService';

interface ExternalDailyRoomProps {
  virtualClassId: string;
  virtualClassTitle: string;
  userId: string;
  userName: string;
  isInstructor: boolean;
  onLeave: () => void;
  onFallbackToP2P?: () => void;
  chatEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
}

/**
 * ExternalDailyRoom - Opens Daily.co room in a new browser tab
 * 
 * This approach bypasses iframe embedding issues (firewall/CSP blocking)
 * by opening the room in a separate browser tab where Daily.co has full control.
 * 
 * Falls back to P2P if room creation fails.
 */
const ExternalDailyRoom: React.FC<ExternalDailyRoomProps> = ({
  virtualClassId,
  virtualClassTitle,
  userId,
  userName,
  isInstructor,
  onLeave,
  onFallbackToP2P,
  chatEnabled = true,
  screenShareEnabled = true,
  recordingEnabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const windowRef = useRef<Window | null>(null);

  // Initialize room and get URL
  const initializeRoom = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const roomName = generateRoomName(virtualClassId);
      console.log('Creating/getting Daily.co room for external access:', roomName);

      // Create or get the room
      const { url } = await createDailyRoom({
        roomName,
        expiryMinutes: 180,
        maxParticipants: 1000,
        enableRecording: recordingEnabled,
        enableChat: chatEnabled,
        enableScreenShare: screenShareEnabled,
      });

      console.log('Room ready:', url);

      // Create a token for this user
      const userToken = await createDailyToken({
        roomName,
        userId,
        userName,
        isOwner: isInstructor,
        expiryMinutes: 180,
      });

      console.log('Token created for external access');

      setRoomUrl(url);
      setToken(userToken);
      setIsLoading(false);
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la salle');
      setIsLoading(false);
    }
  }, [virtualClassId, userId, userName, isInstructor, chatEnabled, screenShareEnabled, recordingEnabled]);

  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  // Open room in new tab
  const openRoom = useCallback(() => {
    if (!roomUrl || !token) return;

    // Build the Daily.co URL with token
    const fullUrl = `${roomUrl}?t=${token}`;
    
    // Open in new tab
    const newWindow = window.open(fullUrl, '_blank', 'noopener,noreferrer');
    windowRef.current = newWindow;
    
    if (newWindow) {
      setHasOpened(true);
      toast.success('La salle de classe s\'ouvre dans un nouvel onglet');
    } else {
      // Popup blocked
      toast.error('Le navigateur a bloqué l\'ouverture. Autorisez les popups et réessayez.');
    }
  }, [roomUrl, token]);

  // Auto-open on first load (with user gesture requirement bypassed by button click)
  const handleJoin = () => {
    openRoom();
  };

  // Handle leaving
  const handleLeave = () => {
    // Close the external window if still open
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    onLeave();
  };

  // Trigger P2P fallback
  const handleFallbackToP2P = () => {
    if (onFallbackToP2P) {
      toast.info('Basculement vers le mode P2P...');
      onFallbackToP2P();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Préparation de la salle...</p>
          <p className="text-muted-foreground text-sm mt-1">Configuration de la classe virtuelle</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de connexion</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={initializeRoom}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
              {onFallbackToP2P && (
                <Button variant="secondary" onClick={handleFallbackToP2P}>
                  Mode P2P
                </Button>
              )}
              <Button variant="outline" onClick={onLeave}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ready state - show join button or "already open" status
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0F0F1A] via-[#1A1A2E] to-[#252542] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1A1A2E]/80 backdrop-blur border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">{virtualClassTitle}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {isInstructor && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  Formateur
                </Badge>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Mode nouvel onglet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-lg w-full bg-[#1A1A2E]/50 border-gray-700">
          <CardContent className="pt-8 pb-8 text-center">
            {!hasOpened ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
                  <ExternalLink className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Prêt à rejoindre
                </h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                  La classe virtuelle s'ouvrira dans un nouvel onglet pour une meilleure compatibilité avec votre réseau.
                </p>
                <Button 
                  size="lg" 
                  onClick={handleJoin}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Ouvrir la classe
                </Button>
                
                {onFallbackToP2P && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-3">Problème de connexion ?</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleFallbackToP2P}
                      className="text-gray-400 hover:text-white"
                    >
                      Utiliser le mode P2P alternatif
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Classe ouverte
                </h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                  La classe virtuelle est ouverte dans un autre onglet. Vous pouvez y retourner ou rejoindre à nouveau.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button 
                    size="lg" 
                    onClick={openRoom}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Ouvrir à nouveau
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1A1A2E]/80 backdrop-blur border-t border-gray-800">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full px-6"
          onClick={handleLeave}
        >
          <PhoneOff className="w-5 h-5 mr-2" />
          Quitter
        </Button>
      </div>
    </div>
  );
};

export default ExternalDailyRoom;
