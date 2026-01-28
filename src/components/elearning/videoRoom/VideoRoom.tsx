import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Info, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebRTCMesh } from '@/hooks/useWebRTCMesh';
import { useVirtualClassChat } from '@/hooks/useVirtualClassChat';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { VirtualClass } from '@/services/virtualClassService';
import ModernVideoControls from './ModernVideoControls';
import ParticipantVideoTile from './ParticipantVideoTile';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import WhiteboardPanel from './WhiteboardPanel';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VideoRoomProps {
  virtualClass: VirtualClass;
  onLeave: () => void;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ virtualClass, onLeave }) => {
  const { userId, userRole, loading: userLoading } = useCurrentUser();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

  const isHost = virtualClass.instructor_id === userId || 
    userRole === 'Admin' || 
    userRole === 'AdminPrincipal';

  // WebRTC hook
  const {
    isConnected,
    localStream,
    screenStream,
    remoteStreams,
    participants,
    mediaState,
    isHandRaised,
    isRecording,
    localVideoRef,
    joinClass,
    leaveClass,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    toggleHandRaise,
    startRecording,
    stopRecording,
  } = useWebRTCMesh({
    classId: virtualClass.id,
    userId: userId || '',
    audio: true,
    video: true,
  });

  // Chat hook
  const {
    messages,
    pinnedMessages,
    unreadCount,
    sendMessage,
    togglePin,
    deleteMessage,
  } = useVirtualClassChat({
    classId: virtualClass.id,
    userId: userId || '',
  });

  // Join class when user is ready
  const handleJoinClass = useCallback(async () => {
    if (!userId) {
      setError('Vous devez être connecté pour rejoindre la classe');
      setIsJoining(false);
      return;
    }

    setIsJoining(true);
    setError(null);
    
    try {
      console.log('Joining class with userId:', userId);
      const success = await joinClass();
      if (!success) {
        setError('Impossible de rejoindre la classe. Vérifiez vos permissions caméra/micro.');
      }
    } catch (err) {
      console.error('Error joining class:', err);
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsJoining(false);
      setHasAttemptedJoin(true);
    }
  }, [userId, joinClass]);

  // Wait for user to load, then join
  useEffect(() => {
    // Don't join if still loading user or already attempted
    if (userLoading) {
      console.log('Waiting for user to load...');
      return;
    }

    // Don't re-join if already connected
    if (isConnected) {
      setIsJoining(false);
      return;
    }

    // Don't re-join if already attempted and failed
    if (hasAttemptedJoin && error) {
      return;
    }

    // User loaded, try to join
    if (userId && !hasAttemptedJoin) {
      handleJoinClass();
    } else if (!userId && !userLoading) {
      setError('Vous devez être connecté pour rejoindre la classe');
      setIsJoining(false);
    }
  }, [userId, userLoading, isConnected, hasAttemptedJoin, error, handleJoinClass]);

  // Handle leave
  const handleLeave = async () => {
    await leaveClass();
    onLeave();
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setHasAttemptedJoin(false);
    handleJoinClass();
  };

  // Handle screen share toggle
  const handleToggleScreenShare = () => {
    if (mediaState.screenShare) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Loading state (user loading or joining)
  if (userLoading || (isJoining && !error)) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">
            {userLoading ? 'Chargement de votre session...' : 'Connexion à la classe...'}
          </h2>
          <p className="text-muted-foreground">
            {userLoading ? 'Vérification de votre compte' : 'Configuration de votre caméra et microphone'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Impossible de rejoindre</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onLeave}>Retour</Button>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Build participants with local user
  const localParticipant: import('@/services/elearning/webrtcSignalingService').Participant = {
    id: 'local',
    user_id: userId || '',
    virtual_class_id: virtualClass.id,
    status: 'Présent',
    is_muted: !mediaState.audio,
    is_video_off: !mediaState.video,
    is_hand_raised: isHandRaised,
    role: isHost ? 'host' : 'participant',
    joined_at: new Date().toISOString(),
    user: {
      id: userId || '',
      first_name: 'Vous',
      last_name: '',
      profile_photo_url: null,
    }
  };

  const allParticipants = [localParticipant, ...participants.filter(p => p.user_id !== userId)];

  // Determine main view content
  const mainStream = screenStream || localStream;
  const hasRemoteParticipants = participants.filter(p => p.user_id !== userId).length > 0;

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col relative",
        (isChatOpen || isParticipantsOpen || isWhiteboardOpen) && "hidden md:flex"
      )}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent z-10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white" onClick={handleLeave}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-white font-semibold">{virtualClass.title}</h1>
                <p className="text-white/70 text-sm">
                  {format(new Date(virtualClass.date), 'EEEE d MMMM', { locale: fr })} • 
                  {virtualClass.start_time?.substring(0, 5)} - {virtualClass.end_time?.substring(0, 5)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 pt-20 pb-28">
          {screenStream ? (
            // Screen share mode
            <div className="h-full flex flex-col gap-4">
              <div className="flex-1 relative rounded-xl overflow-hidden bg-muted">
                <video
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                  ref={(el) => {
                    if (el && screenStream) {
                      el.srcObject = screenStream;
                    }
                  }}
                />
              </div>
              
              {/* Small video strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div className="w-40 flex-shrink-0">
                  <ParticipantVideoTile 
                    participant={localParticipant}
                    stream={localStream}
                    isLocal
                  />
                </div>
                {participants.filter(p => p.user_id !== userId).map((participant) => (
                  <div key={participant.id} className="w-40 flex-shrink-0">
                    <ParticipantVideoTile
                      participant={participant}
                      stream={remoteStreams.get(participant.user_id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Normal grid mode
            <div className={cn(
              "h-full grid gap-4",
              allParticipants.length === 1 && "grid-cols-1",
              allParticipants.length === 2 && "grid-cols-1 md:grid-cols-2",
              allParticipants.length >= 3 && allParticipants.length <= 4 && "grid-cols-2",
              allParticipants.length >= 5 && allParticipants.length <= 6 && "grid-cols-2 md:grid-cols-3",
              allParticipants.length >= 7 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}>
              {/* Local participant */}
              <ParticipantVideoTile
                participant={localParticipant}
                stream={localStream}
                isLocal
                isLarge={allParticipants.length <= 2}
              />
              
              {/* Remote participants */}
              {participants.filter(p => p.user_id !== userId).map((participant) => (
                <ParticipantVideoTile
                  key={participant.id}
                  participant={participant}
                  stream={remoteStreams.get(participant.user_id)}
                  isLarge={allParticipants.length <= 2}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <ModernVideoControls
          isMuted={!mediaState.audio}
          isVideoOff={!mediaState.video}
          isScreenSharing={mediaState.screenShare}
          isHandRaised={isHandRaised}
          isChatOpen={isChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          isWhiteboardOpen={isWhiteboardOpen}
          isRecording={isRecording}
          unreadMessages={unreadCount}
          participantCount={allParticipants.length}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleHandRaise={toggleHandRaise}
          onToggleChat={() => {
            setIsChatOpen(!isChatOpen);
            setIsParticipantsOpen(false);
            setIsWhiteboardOpen(false);
          }}
          onToggleParticipants={() => {
            setIsParticipantsOpen(!isParticipantsOpen);
            setIsChatOpen(false);
            setIsWhiteboardOpen(false);
          }}
          onToggleWhiteboard={() => {
            setIsWhiteboardOpen(!isWhiteboardOpen);
            setIsChatOpen(false);
            setIsParticipantsOpen(false);
          }}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onLeaveCall={handleLeave}
          isHost={isHost}
        />
      </div>

      {/* Side Panels */}
      {isChatOpen && (
        <div className="w-full md:w-80 h-full">
          <ChatPanel
            messages={messages}
            pinnedMessages={pinnedMessages}
            currentUserId={userId || ''}
            onSendMessage={async (content) => { await sendMessage(content); }}
            onTogglePin={togglePin}
            onDeleteMessage={deleteMessage}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}

      {isParticipantsOpen && (
        <div className="w-full md:w-80 h-full">
          <ParticipantsPanel
            participants={allParticipants}
            currentUserId={userId || ''}
            isHost={isHost}
            onClose={() => setIsParticipantsOpen(false)}
          />
        </div>
      )}

      {isWhiteboardOpen && (
        <div className="w-full md:w-[500px] h-full">
          <WhiteboardPanel
            classId={virtualClass.id}
            userId={userId || ''}
            onClose={() => setIsWhiteboardOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default VideoRoom;
