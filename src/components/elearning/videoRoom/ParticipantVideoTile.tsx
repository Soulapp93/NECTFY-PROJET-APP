import React, { useRef, useEffect } from 'react';
import { User, MicOff, VideoOff, Hand, Crown, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Participant } from '@/services/elearning/webrtcSignalingService';

interface ParticipantVideoTileProps {
  participant: Participant;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isLarge?: boolean;
  className?: string;
}

const ParticipantVideoTile: React.FC<ParticipantVideoTileProps> = ({
  participant,
  stream,
  isLocal = false,
  isSpeaking = false,
  isLarge = false,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const displayName = participant.user 
    ? `${participant.user.first_name} ${participant.user.last_name}`
    : 'Participant';

  const initials = participant.user 
    ? `${participant.user.first_name?.[0] || ''}${participant.user.last_name?.[0] || ''}`
    : 'P';

  const roleIcon = participant.role === 'host' 
    ? <Crown className="h-3 w-3" /> 
    : participant.role === 'co-host' 
    ? <Shield className="h-3 w-3" />
    : null;

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden bg-muted transition-all",
        isLarge ? "aspect-video" : "aspect-video",
        isSpeaking && "ring-2 ring-primary",
        className
      )}
    >
      {/* Video or Avatar */}
      {stream && !participant.is_video_off ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
          <Avatar className={cn("border-2 border-background", isLarge ? "h-24 w-24" : "h-16 w-16")}>
            <AvatarImage src={participant.user?.profile_photo_url || undefined} />
            <AvatarFallback className={cn("bg-primary text-primary-foreground", isLarge ? "text-3xl" : "text-xl")}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Name and status */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {roleIcon && (
            <span className="text-yellow-400">{roleIcon}</span>
          )}
          <span className="text-white text-sm font-medium truncate max-w-[120px]">
            {isLocal ? 'Vous' : displayName}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {participant.is_hand_raised && (
            <Badge variant="warning" className="h-6 w-6 p-0 flex items-center justify-center animate-bounce">
              <Hand className="h-3 w-3" />
            </Badge>
          )}
          {participant.is_muted && (
            <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center">
              <MicOff className="h-3 w-3" />
            </Badge>
          )}
          {participant.is_video_off && (
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
              <VideoOff className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-2 right-2">
          <div className="flex gap-0.5">
            <div className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantVideoTile;
