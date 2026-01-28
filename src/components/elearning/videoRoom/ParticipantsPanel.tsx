import React from 'react';
import { User, MicOff, VideoOff, Hand, Crown, Shield, MoreVertical, UserX, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { X } from 'lucide-react';
import { Participant } from '@/services/elearning/webrtcSignalingService';
import { cn } from '@/lib/utils';

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId: string;
  isHost: boolean;
  onClose: () => void;
  onMuteParticipant?: (userId: string) => void;
  onRemoveParticipant?: (userId: string) => void;
  onPromoteParticipant?: (userId: string, role: 'co-host' | 'participant') => void;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  currentUserId,
  isHost,
  onClose,
  onMuteParticipant,
  onRemoveParticipant,
  onPromoteParticipant,
}) => {
  // Sort participants: hosts first, then co-hosts, then hand raised, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === 'host' && b.role !== 'host') return -1;
    if (a.role !== 'host' && b.role === 'host') return 1;
    if (a.role === 'co-host' && b.role === 'participant') return -1;
    if (a.role === 'participant' && b.role === 'co-host') return 1;
    if (a.is_hand_raised && !b.is_hand_raised) return -1;
    if (!a.is_hand_raised && b.is_hand_raised) return 1;
    return 0;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'host': return 'Animateur';
      case 'co-host': return 'Co-animateur';
      default: return 'Participant';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'co-host': return <Shield className="h-3 w-3 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Participants</h3>
          <Badge variant="secondary">{participants.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedParticipants.map((participant) => {
            const isCurrentUser = participant.user_id === currentUserId;
            const displayName = participant.user 
              ? `${participant.user.first_name} ${participant.user.last_name}`
              : 'Participant';
            const initials = participant.user 
              ? `${participant.user.first_name?.[0] || ''}${participant.user.last_name?.[0] || ''}`
              : 'P';

            return (
              <div 
                key={participant.id} 
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors",
                  participant.is_hand_raised && "bg-warning/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.user?.profile_photo_url || undefined} />
                      <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    {participant.status === 'Présent' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      {getRoleIcon(participant.role)}
                      <span className="font-medium text-sm">
                        {displayName}
                        {isCurrentUser && <span className="text-muted-foreground"> (Vous)</span>}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getRoleLabel(participant.role)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {participant.is_hand_raised && (
                    <Badge variant="warning" className="h-6 w-6 p-0 flex items-center justify-center animate-pulse">
                      <Hand className="h-3 w-3" />
                    </Badge>
                  )}
                  
                  {participant.is_muted ? (
                    <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center">
                      <MicOff className="h-3 w-3" />
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                      <Volume2 className="h-3 w-3" />
                    </Badge>
                  )}

                  {participant.is_video_off && (
                    <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center">
                      <VideoOff className="h-3 w-3" />
                    </Badge>
                  )}

                  {/* Host controls */}
                  {isHost && !isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onMuteParticipant?.(participant.user_id)}>
                          {participant.is_muted ? (
                            <>
                              <Volume2 className="h-4 w-4 mr-2" />
                              Autoriser le micro
                            </>
                          ) : (
                            <>
                              <VolumeX className="h-4 w-4 mr-2" />
                              Couper le micro
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {participant.role === 'participant' && (
                          <DropdownMenuItem onClick={() => onPromoteParticipant?.(participant.user_id, 'co-host')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Promouvoir co-animateur
                          </DropdownMenuItem>
                        )}
                        
                        {participant.role === 'co-host' && (
                          <DropdownMenuItem onClick={() => onPromoteParticipant?.(participant.user_id, 'participant')}>
                            <User className="h-4 w-4 mr-2" />
                            Rétrograder participant
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onRemoveParticipant?.(participant.user_id)}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Expulser
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}

          {participants.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Aucun participant pour le moment
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParticipantsPanel;
