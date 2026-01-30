import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrentUser, useUserWithRelations } from '@/hooks/useCurrentUser';
import { VirtualClass } from '@/services/virtualClassService';
import DailyVideoRoom from './DailyVideoRoom';
import VideoRoom from './videoRoom/VideoRoom';
import MediaPermissionDialog from './MediaPermissionDialog';
import { getDailyRoomInfo, generateRoomName } from '@/services/dailyService';

interface ScalableVideoRoomProps {
  virtualClass: VirtualClass;
  onLeave: () => void;
}

/**
 * ScalableVideoRoom - Intelligent wrapper that selects the best video technology
 * 
 * - Uses Daily.co SFU for scalability (supports 1000+ participants)
 * - Falls back to native WebRTC for reliability if Daily.co fails
 * - Provides unified interface for both systems
 */
const ScalableVideoRoom: React.FC<ScalableVideoRoomProps> = ({
  virtualClass,
  onLeave,
}) => {
  const { userId, userRole, loading: userLoading } = useCurrentUser();
  const { userInfo } = useUserWithRelations();
  const [showPermissionDialog, setShowPermissionDialog] = useState(true);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [useDaily, setUseDaily] = useState(true); // Default to Daily.co for scalability
  const [dailyAvailable, setDailyAvailable] = useState<boolean | null>(null);

  const isInstructor = virtualClass.instructor_id === userId || 
    userRole === 'Admin' || 
    userRole === 'AdminPrincipal';

  const userName = userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : 'Participant';

  // Check Daily.co availability on mount
  useEffect(() => {
    const checkDaily = async () => {
      try {
        const roomName = generateRoomName(virtualClass.id);
        // Try to get room info - if it fails, Daily.co might not be configured
        await getDailyRoomInfo(roomName).catch(() => {
          // Room doesn't exist yet - that's fine, we'll create it
          console.log('Room does not exist yet, will be created on join');
        });
        setDailyAvailable(true);
      } catch (error) {
        console.warn('Daily.co not available, falling back to P2P:', error);
        setDailyAvailable(false);
        setUseDaily(false);
      }
    };

    checkDaily();
  }, [virtualClass.id]);

  // Request media permissions
  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      // Stop the stream immediately - we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      setShowPermissionDialog(false);
    } catch (error) {
      console.error('Permission denied:', error);
      // Still allow joining in read-only mode
      setHasPermission(false);
      setShowPermissionDialog(false);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Loading state
  if (userLoading || dailyAvailable === null) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Préparation de la classe...</h2>
          <p className="text-muted-foreground">Configuration du système vidéo</p>
        </div>
      </div>
    );
  }

  // User not found
  if (!userId) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour rejoindre cette classe virtuelle.
            </p>
            <Button onClick={onLeave}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permission dialog
  if (showPermissionDialog) {
    return (
      <MediaPermissionDialog
        isOpen={showPermissionDialog}
        onRequestPermission={handleRequestPermission}
        onCancel={onLeave}
        isLoading={isRequestingPermission}
      />
    );
  }

  // Use Daily.co for scalable video
  if (useDaily && dailyAvailable) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <DailyVideoRoom
          virtualClassId={virtualClass.id}
          virtualClassTitle={virtualClass.title}
          userId={userId}
          userName={userName}
          isInstructor={isInstructor}
          onLeave={onLeave}
          onFallbackToP2P={() => setUseDaily(false)}
          chatEnabled={true}
          screenShareEnabled={true}
          recordingEnabled={virtualClass.recording_enabled ?? false}
          virtualClass={virtualClass}
        />
      </div>
    );
  }

  // Fallback to native WebRTC P2P
  return <VideoRoom virtualClass={virtualClass} onLeave={onLeave} />;
};

export default ScalableVideoRoom;
