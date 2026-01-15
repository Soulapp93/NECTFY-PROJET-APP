
import React, { useState, useEffect } from 'react';
import { Monitor, MicOff } from 'lucide-react';
import VideoControls from './videoCall/VideoControls';
import ChatSidebar from './videoCall/ChatSidebar';
import ParticipantVideo from './videoCall/ParticipantVideo';
import MediaPermissionDialog from './MediaPermissionDialog';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface VirtualClass {
  id: number;
  title: string;
  instructor: string;
  participants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  date: string;
}

interface VideoCallProps {
  selectedClass: VirtualClass;
  onLeaveCall: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ selectedClass, onLeaveCall }) => {
  const { userId } = useCurrentUser();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(true);
  const [chatMessage, setChatMessage] = useState('');

  // WebRTC Hook for media management
  const {
    mediaState,
    streamState,
    permissionGranted,
    isLoading,
    localVideoRef,
    requestMediaAccess,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup
  } = useWebRTC();

  // Realtime chat hook - use simple message format
  const {
    messages: realtimeMessages,
    isConnected: chatConnected,
    sendMessage: sendRealtimeMessage
  } = useRealtimeChat(selectedClass.id.toString());

  // Convert realtime messages to legacy format for compatibility
  const messages = realtimeMessages.map((msg, index) => ({
    id: index + 1,
    sender: msg.sender_name || 'Utilisateur',
    message: msg.content,
    time: new Date(msg.created_at).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    isInstructor: msg.is_instructor || false
  }));

  // Mock participants for now - in real app, this would come from WebRTC connections
  const participants = [
    { 
      id: 'instructor', 
      name: selectedClass.instructor, 
      role: 'Instructor', 
      stream: streamState.localStream,
      isMuted: !mediaState.audio, 
      isVideoOff: !mediaState.video,
      isInstructor: true
    },
    { 
      id: 'user', 
      name: 'Vous', 
      role: 'Student', 
      stream: streamState.localStream,
      isMuted: !mediaState.audio, 
      isVideoOff: !mediaState.video
    },
  ];

  const handleRequestPermission = async () => {
    await requestMediaAccess();
    if (permissionGranted) {
      setShowPermissionDialog(false);
    }
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      await sendRealtimeMessage(chatMessage);
      setChatMessage('');
    }
  };

  const handleScreenShare = () => {
    if (streamState.isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <>
      <MediaPermissionDialog
        isOpen={showPermissionDialog}
        onRequestPermission={handleRequestPermission}
        onCancel={onLeaveCall}
        isLoading={isLoading}
      />

      <div className="h-screen bg-background flex flex-col">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Main presenter video or screen share */}
          <div className="h-full flex items-center justify-center relative">
            {streamState.isScreenSharing ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Partage d'écran actif</h3>
                  <p className="text-muted-foreground">Présentation en cours par {selectedClass.instructor}</p>
                </div>
              </div>
            ) : streamState.localStream ? (
              <div className="w-full h-full relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Local video overlay */}
                <div className="absolute bottom-4 left-4">
                  <ParticipantVideo
                    participant={{
                      id: 'local',
                      name: 'Vous',
                      role: 'Student',
                      stream: streamState.localStream,
                      isMuted: !mediaState.audio,
                      isVideoOff: !mediaState.video,
                    }}
                    isLocal={true}
                    className="w-48 h-36"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-40 h-40 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl font-bold text-primary-foreground">
                    {selectedClass.instructor?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold mb-2">{selectedClass.instructor}</h3>
                <p className="text-muted-foreground text-lg">{selectedClass.title}</p>
                <div className="flex items-center justify-center mt-4 space-x-4">
                  <span className="bg-green-500 w-3 h-3 rounded-full"></span>
                  <span className="text-sm">En direct</span>
                </div>
              </div>
            )}

            {/* Recording indicator */}
            <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3">
              <div className="flex items-center space-x-3 text-white">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">REC</span>
                <span className="text-sm">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Participants Grid */}
          {!streamState.isScreenSharing && participants.length > 1 && (
            <div className="absolute top-4 right-4 w-80 bg-card rounded-lg overflow-hidden border">
              <div className="p-3 border-b">
                <span className="text-sm font-medium">
                  Participants ({participants.length})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 max-h-60 overflow-y-auto">
                {participants.map((participant) => (
                  <ParticipantVideo
                    key={participant.id}
                    participant={participant}
                    className="aspect-video"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Chat Sidebar */}
          <ChatSidebar 
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
            messages={messages}
            chatMessage={chatMessage}
            setChatMessage={setChatMessage}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Control Bar */}
        <VideoControls 
          isMuted={!mediaState.audio}
          toggleAudio={toggleAudio}
          isVideoOff={!mediaState.video}
          toggleVideo={toggleVideo}
          isSpeakerOff={false}
          toggleSpeaker={() => {}}
          isScreenSharing={streamState.isScreenSharing}
          toggleScreenShare={handleScreenShare}
          isHandRaised={isHandRaised}
          setIsHandRaised={setIsHandRaised}
          isChatOpen={isChatOpen}
          setIsChatOpen={setIsChatOpen}
          isParticipantsOpen={isParticipantsOpen}
          setIsParticipantsOpen={setIsParticipantsOpen}
          messageCount={messages.length}
          onLeaveCall={onLeaveCall}
          selectedClass={selectedClass}
        />
      </div>
    </>
  );
};

export default VideoCall;
