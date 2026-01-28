import React, { useRef, useEffect, useState } from 'react';
import { MicOff, VideoOff, Hand, Crown, Shield, Volume2 } from 'lucide-react';
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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // Check for video tracks
      const videoTracks = stream.getVideoTracks();
      setHasVideoTrack(videoTracks.length > 0 && videoTracks.some(t => t.enabled));
      
      // Handle video playing
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          setIsVideoPlaying(true);
        }).catch(err => {
          console.warn('Video autoplay failed:', err);
          setIsVideoPlaying(false);
        });
      };

      // Track changes listener
      const handleTrackChange = () => {
        const tracks = stream.getVideoTracks();
        setHasVideoTrack(tracks.length > 0 && tracks.some(t => t.enabled));
      };

      stream.addEventListener('addtrack', handleTrackChange);
      stream.addEventListener('removetrack', handleTrackChange);

      return () => {
        stream.removeEventListener('addtrack', handleTrackChange);
        stream.removeEventListener('removetrack', handleTrackChange);
      };
    } else {
      setIsVideoPlaying(false);
      setHasVideoTrack(false);
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

  const showVideo = stream && hasVideoTrack && !participant.is_video_off;

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 transition-all duration-300",
        isLarge ? "aspect-video" : "aspect-video",
        isSpeaking && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className
      )}
    >
      {/* Video or Avatar */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLocal && "transform scale-x-[-1]", // Mirror local video
            isVideoPlaying ? "opacity-100" : "opacity-0"
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted via-muted to-muted-foreground/10">
          <Avatar className={cn(
            "border-4 border-background/50 shadow-xl",
            isLarge ? "h-32 w-32" : "h-20 w-20"
          )}>
            <AvatarImage src={participant.user?.profile_photo_url || undefined} />
            <AvatarFallback className={cn(
              "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold",
              isLarge ? "text-4xl" : "text-2xl"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* If no video is playing but we have a stream, show avatar overlay */}
      {stream && !isVideoPlaying && hasVideoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <Avatar className={cn("border-4 border-background/50", isLarge ? "h-32 w-32" : "h-20 w-20")}>
            <AvatarFallback className={cn(
              "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold",
              isLarge ? "text-4xl" : "text-2xl"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Name and status */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {roleIcon && (
            <span className="text-yellow-400 drop-shadow-md">{roleIcon}</span>
          )}
          <span className="text-white text-sm font-medium truncate max-w-[150px] drop-shadow-md">
            {isLocal ? 'Vous' : displayName}
          </span>
          {!participant.is_muted && (
            <Volume2 className="h-3 w-3 text-emerald-400 animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {participant.is_hand_raised && (
            <Badge className="h-6 w-6 p-0 flex items-center justify-center bg-amber-500 animate-bounce">
              <Hand className="h-3 w-3 text-white" />
            </Badge>
          )}
          {participant.is_muted && (
            <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center">
              <MicOff className="h-3 w-3" />
            </Badge>
          )}
          {participant.is_video_off && (
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center bg-muted-foreground/50">
              <VideoOff className="h-3 w-3" />
            </Badge>
          )}
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-3 right-3">
          <div className="flex gap-0.5 items-end">
            <div className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <div className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
        </div>
      )}

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="text-xs bg-primary/80 text-primary-foreground border-0">
            Vous
          </Badge>
        </div>
      )}
    </div>
  );
};

export default ParticipantVideoTile;