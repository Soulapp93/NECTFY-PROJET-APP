import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, Hand, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ParticipantVideoProps {
  participant: {
    id: string;
    name: string;
    role: string;
    stream?: MediaStream;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isHandRaised?: boolean;
    isInstructor?: boolean;
    isSpeaking?: boolean;
  };
  isLocal?: boolean;
  className?: string;
}

const ParticipantVideo: React.FC<ParticipantVideoProps> = ({
  participant,
  isLocal = false,
  className = ""
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getBorderColor = () => {
    if (participant.isSpeaking) return 'border-primary';
    if (participant.isInstructor) return 'border-purple-500';
    return 'border-border';
  };

  return (
    <div className={`relative bg-background rounded-lg overflow-hidden ${getBorderColor()} border-2 ${className}`}>
      {/* Video or Avatar */}
      {!participant.isVideoOff && participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Always mute local video to prevent feedback
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-lg">
              {getInitials(participant.name)}
            </span>
          </div>
        </div>
      )}

      {/* Overlay Information */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top indicators */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {participant.isInstructor && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              <Crown className="h-3 w-3 mr-1" />
              Formateur
            </Badge>
          )}
          {isLocal && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              Vous
            </Badge>
          )}
        </div>

        {/* Top right indicators */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {participant.isHandRaised && (
            <div className="bg-yellow-500 rounded-full p-1">
              <Hand className="h-3 w-3 text-white" />
            </div>
          )}
          {participant.isSpeaking && (
            <div className="bg-green-500 rounded-full p-1 animate-pulse">
              <Volume2 className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Bottom information */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-medium truncate">
              {participant.name}
            </span>
            <div className="flex items-center gap-1">
              {participant.isMuted ? (
                <div className="bg-red-500 rounded-full p-1">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              ) : (
                <div className="bg-green-500 rounded-full p-1">
                  <Mic className="h-3 w-3 text-white" />
                </div>
              )}
              {participant.isVideoOff && (
                <div className="bg-red-500 rounded-full p-1">
                  <VideoOff className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantVideo;