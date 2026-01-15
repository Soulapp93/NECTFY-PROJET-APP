
import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  Share, 
  MessageCircle, 
  Users, 
  Hand,
  Settings,
  MoreVertical,
  Volume2,
  VolumeX
} from 'lucide-react';

interface VideoControlsProps {
  isMuted: boolean;
  toggleAudio: () => void;
  isVideoOff: boolean;
  toggleVideo: () => void;
  isSpeakerOff: boolean;
  toggleSpeaker: () => void;
  isScreenSharing: boolean;
  toggleScreenShare: () => void;
  isHandRaised: boolean;
  setIsHandRaised: (raised: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isParticipantsOpen: boolean;
  setIsParticipantsOpen: (open: boolean) => void;
  messageCount: number;
  onLeaveCall: () => void;
  selectedClass: any;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  toggleAudio,
  isVideoOff,
  toggleVideo,
  isSpeakerOff,
  toggleSpeaker,
  isScreenSharing,
  toggleScreenShare,
  isHandRaised,
  setIsHandRaised,
  isChatOpen,
  setIsChatOpen,
  isParticipantsOpen,
  setIsParticipantsOpen,
  messageCount,
  onLeaveCall,
  selectedClass
}) => {
  return (
    <div className="bg-gray-800 p-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Left side - Class info */}
        <div className="flex items-center space-x-4">
          <div className="text-white">
            <h4 className="font-medium">{selectedClass.title}</h4>
            <p className="text-sm text-gray-300">
              {selectedClass.participants} participants • {selectedClass.startTime.substring(0, 5)} - {selectedClass.endTime.substring(0, 5)}
            </p>
          </div>
        </div>

        {/* Center - Main controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
            title={isMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
            title={isVideoOff ? 'Activer la caméra' : 'Couper la caméra'}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleSpeaker}
            className={`p-3 rounded-full ${isSpeakerOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
            title={isSpeakerOff ? 'Activer le son' : 'Couper le son'}
          >
            {isSpeakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
            title="Partager l'écran"
          >
            <Share className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`p-3 rounded-full ${isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors`}
            title="Lever la main"
          >
            <Hand className="h-5 w-5" />
          </button>
        </div>

        {/* Right side - Secondary controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3 rounded-full ${isChatOpen ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'} text-white transition-colors relative`}
            title="Chat"
          >
            <MessageCircle className="h-5 w-5" />
            {messageCount > 2 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {messageCount - 2}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title="Participants"
          >
            <Users className="h-5 w-5" />
          </button>

          <button className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors">
            <Settings className="h-5 w-5" />
          </button>

          <button className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>

          <button
            onClick={onLeaveCall}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            <Phone className="h-5 w-5 mr-2" />
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
