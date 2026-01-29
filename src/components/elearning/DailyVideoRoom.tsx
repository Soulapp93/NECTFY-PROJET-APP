import React, { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  PhoneOff, 
  Users, 
  Loader2, 
  AlertCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  Maximize,
  Minimize,
  ClipboardList
} from 'lucide-react';
import { createDailyRoom, createDailyToken, generateRoomName } from '@/services/dailyService';
import LiveAttendanceMenu from './LiveAttendanceMenu';
import { VirtualClass } from '@/services/virtualClassService';

interface DailyVideoRoomProps {
  virtualClassId: string;
  virtualClassTitle: string;
  userId: string;
  userName: string;
  isInstructor: boolean;
  onLeave: () => void;
  chatEnabled?: boolean;
  screenShareEnabled?: boolean;
  recordingEnabled?: boolean;
  virtualClass?: VirtualClass; // Full virtual class object for attendance
}

const DailyVideoRoom: React.FC<DailyVideoRoomProps> = ({
  virtualClassId,
  virtualClassTitle,
  userId,
  userName,
  isInstructor,
  onLeave,
  chatEnabled = true,
  screenShareEnabled = true,
  recordingEnabled = false,
  virtualClass,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const hasInitialized = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAttendanceMenuOpen, setIsAttendanceMenuOpen] = useState(false);
  
  // Store onLeave in a ref to avoid dependency issues
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  const updateParticipantCount = useCallback((callFrame: DailyCall) => {
    const participants = callFrame.participants();
    setParticipantCount(Object.keys(participants).length);
  }, []);

  const initializeCall = useCallback(async () => {
    // Prevent double initialization
    if (hasInitialized.current || !containerRef.current) {
      return;
    }
    hasInitialized.current = true;
    
    try {
      setIsLoading(true);
      setError(null);

      const roomName = generateRoomName(virtualClassId);
      console.log('Initializing Daily.co room:', roomName);

      // Create or get the room
      const { url } = await createDailyRoom({
        roomName,
        expiryMinutes: 180, // 3 hours
        maxParticipants: 1000,
        enableRecording: recordingEnabled,
        enableChat: chatEnabled,
        enableScreenShare: screenShareEnabled,
      });

      console.log('Room created/retrieved:', url);

      // Create a token for this user
      const token = await createDailyToken({
        roomName,
        userId,
        userName,
        isOwner: isInstructor,
        expiryMinutes: 180,
      });

      console.log('Token created for user');

      // Create the Daily call frame
      const callFrame = DailyIframe.createFrame(containerRef.current!, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
        },
        showLeaveButton: false,
        showFullscreenButton: true,
        showLocalVideo: true,
        showParticipantsBar: true,
        theme: {
          colors: {
            accent: '#8B5CF6',
            accentText: '#FFFFFF',
            background: '#1A1A2E',
            backgroundAccent: '#252542',
            baseText: '#FFFFFF',
            border: '#374151',
            mainAreaBg: '#0F0F1A',
            mainAreaBgAccent: '#1A1A2E',
            mainAreaText: '#FFFFFF',
            supportiveText: '#9CA3AF',
          },
        },
      });

      callRef.current = callFrame;

      // Set up event listeners
      callFrame.on('joined-meeting', () => {
        console.log('Joined meeting successfully');
        setIsLoading(false);
        toast.success('Vous avez rejoint la classe virtuelle');
      });

      callFrame.on('left-meeting', () => {
        console.log('Left meeting');
        onLeaveRef.current();
      });

      callFrame.on('participant-joined', (event) => {
        console.log('Participant joined:', event?.participant?.user_name);
        updateParticipantCount(callFrame);
        if (!event?.participant?.local) {
          toast.info(`${event?.participant?.user_name || 'Un participant'} a rejoint`);
        }
      });

      callFrame.on('participant-left', (event) => {
        console.log('Participant left:', event?.participant?.user_name);
        updateParticipantCount(callFrame);
        if (!event?.participant?.local) {
          toast.info(`${event?.participant?.user_name || 'Un participant'} a quitté`);
        }
      });

      callFrame.on('error', (event) => {
        console.error('Daily.co error:', event);
        setError(event?.error?.message || 'Une erreur est survenue');
        setIsLoading(false);
        toast.error('Erreur de connexion');
      });

      callFrame.on('camera-error', (event) => {
        console.error('Camera error:', event);
        toast.error('Erreur caméra - vérifiez vos permissions');
      });

      callFrame.on('local-screen-share-started', () => {
        setIsScreenSharing(true);
        toast.success('Partage d\'écran activé');
      });

      callFrame.on('local-screen-share-stopped', () => {
        setIsScreenSharing(false);
      });

      // Join the meeting with timeout
      console.log('Joining meeting with URL:', url);
      const joinPromise = callFrame.join({
        url,
        token,
        userName,
      });

      // Add timeout for join operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: La connexion prend trop de temps')), 30000)
      );

      await Promise.race([joinPromise, timeoutPromise]);
      
      // If join succeeded but event didn't fire, force loading to false
      setTimeout(() => {
        if (isLoading) {
          console.log('Forcing loading state to false after successful join');
          setIsLoading(false);
        }
      }, 5000);

    } catch (err) {
      console.error('Error initializing call:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      setIsLoading(false);
      hasInitialized.current = false; // Allow retry
    }
  }, [virtualClassId, userId, userName, isInstructor, chatEnabled, screenShareEnabled, recordingEnabled, updateParticipantCount]);


  useEffect(() => {
    initializeCall();

    return () => {
      if (callRef.current) {
        callRef.current.leave();
        callRef.current.destroy();
        callRef.current = null;
      }
    };
  }, [initializeCall]);

  const handleLeave = async () => {
    if (callRef.current) {
      await callRef.current.leave();
    }
    onLeave();
  };

  const toggleVideo = () => {
    if (callRef.current) {
      callRef.current.setLocalVideo(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (callRef.current) {
      callRef.current.setLocalAudio(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    }
  };

  const toggleScreenShare = async () => {
    if (callRef.current) {
      if (isScreenSharing) {
        callRef.current.stopScreenShare();
      } else {
        await callRef.current.startScreenShare();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de connexion</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={initializeCall}>
                Réessayer
              </Button>
              <Button variant="outline" onClick={onLeave}>
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0F0F1A] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1A1A2E] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Video className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-white font-medium text-sm">{virtualClassTitle}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                En direct
              </Badge>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {participantCount} participant{participantCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isInstructor && virtualClass && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAttendanceMenuOpen(!isAttendanceMenuOpen)}
              className="bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
            >
              <ClipboardList className="w-4 h-4 mr-1.5" />
              Émargement
            </Button>
          )}
          {isInstructor && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              Formateur
            </Badge>
          )}
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F0F1A] z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">Connexion en cours...</p>
              <p className="text-gray-400 text-sm mt-1">Préparation de la classe virtuelle</p>
            </div>
          </div>
        )}
        
        {/* Attendance Menu */}
        {isAttendanceMenuOpen && virtualClass && (
          <LiveAttendanceMenu
            virtualClass={virtualClass}
            isInstructor={isInstructor}
            onClose={() => setIsAttendanceMenuOpen(false)}
          />
        )}
        
        <div 
          ref={containerRef} 
          className="w-full h-full min-h-[500px]"
          style={{ background: '#0F0F1A' }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-[#1A1A2E] border-t border-gray-800">
        <Button
          variant={isAudioOn ? "outline" : "destructive"}
          size="lg"
          className={`rounded-full w-12 h-12 p-0 ${isAudioOn ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
          onClick={toggleAudio}
        >
          {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          variant={isVideoOn ? "outline" : "destructive"}
          size="lg"
          className={`rounded-full w-12 h-12 p-0 ${isVideoOn ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : ''}`}
          onClick={toggleVideo}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        {screenShareEnabled && (
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="lg"
            className={`rounded-full w-12 h-12 p-0 ${isScreenSharing ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
            onClick={toggleScreenShare}
          >
            <MonitorUp className="w-5 h-5" />
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          className="rounded-full w-12 h-12 p-0 bg-gray-700 hover:bg-gray-600 border-gray-600"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </Button>

        <div className="w-px h-8 bg-gray-700 mx-2" />

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

export default DailyVideoRoom;
