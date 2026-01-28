import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  Hand, MessageSquare, Users, PhoneOff, Settings, 
  Maximize2, MoreVertical, Circle, Square, PenTool,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface VideoControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isWhiteboardOpen: boolean;
  isRecording: boolean;
  unreadMessages: number;
  participantCount: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleWhiteboard: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onLeaveCall: () => void;
  isHost?: boolean;
}

const ModernVideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  isHandRaised,
  isChatOpen,
  isParticipantsOpen,
  isWhiteboardOpen,
  isRecording,
  unreadMessages,
  participantCount,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleChat,
  onToggleParticipants,
  onToggleWhiteboard,
  onStartRecording,
  onStopRecording,
  onLeaveCall,
  isHost = false,
}) => {
  return (
    <TooltipProvider>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-6">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {/* Audio Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14"
                onClick={onToggleAudio}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? 'Activer le micro' : 'Couper le micro'}
            </TooltipContent>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14"
                onClick={onToggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isVideoOff ? 'Activer la caméra' : 'Couper la caméra'}
            </TooltipContent>
          </Tooltip>

          {/* Screen Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14"
                onClick={onToggleScreenShare}
              >
                {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
            </TooltipContent>
          </Tooltip>

          {/* Whiteboard */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isWhiteboardOpen ? "default" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14 hidden md:flex"
                onClick={onToggleWhiteboard}
              >
                <PenTool className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tableau blanc</TooltipContent>
          </Tooltip>

          {/* Hand Raise */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHandRaised ? "warning" : "secondary"}
                size="lg"
                className={cn(
                  "rounded-full h-12 w-12 md:h-14 md:w-14",
                  isHandRaised && "animate-pulse"
                )}
                onClick={onToggleHandRaise}
              >
                <Hand className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isHandRaised ? 'Baisser la main' : 'Lever la main'}
            </TooltipContent>
          </Tooltip>

          {/* Participants */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isParticipantsOpen ? "default" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14 relative"
                onClick={onToggleParticipants}
              >
                <Users className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                  {participantCount}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Participants</TooltipContent>
          </Tooltip>

          {/* Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isChatOpen ? "default" : "secondary"}
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14 relative"
                onClick={onToggleChat}
              >
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadMessages}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chat</TooltipContent>
          </Tooltip>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="mb-2">
              {isHost && (
                <>
                  <DropdownMenuItem onClick={isRecording ? onStopRecording : onStartRecording}>
                    {isRecording ? (
                      <>
                        <Square className="h-4 w-4 mr-2 text-destructive" />
                        Arrêter l'enregistrement
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 mr-2 text-destructive" />
                        Démarrer l'enregistrement
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onToggleWhiteboard} className="md:hidden">
                <PenTool className="h-4 w-4 mr-2" />
                Tableau blanc
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Maximize2 className="h-4 w-4 mr-2" />
                Plein écran
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Leave Call */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-12 w-12 md:h-14 md:w-14"
                onClick={onLeaveCall}
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quitter</TooltipContent>
          </Tooltip>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-white px-3 py-1.5 rounded-full text-sm">
            <Circle className="h-3 w-3 fill-white animate-pulse" />
            <span>REC</span>
            <span className="font-mono">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ModernVideoControls;
