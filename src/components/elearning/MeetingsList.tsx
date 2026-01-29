import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  Trash2, 
  MoreVertical,
  User,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { meetingService, Meeting } from '@/services/meetingService';
import { toast } from 'sonner';
import LoadingState from '@/components/ui/loading-state';

interface MeetingsListProps {
  onJoinMeeting: (meeting: Meeting) => void;
}

const MeetingsList: React.FC<MeetingsListProps> = ({ onJoinMeeting }) => {
  const queryClient = useQueryClient();
  const { establishment } = useEstablishment();
  const { userRole } = useCurrentUser();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings', establishment?.id],
    queryFn: () => meetingService.getMeetings(establishment!.id),
    enabled: !!establishment?.id,
  });

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) return;
    
    try {
      await meetingService.deleteMeeting(meetingId);
      toast.success('Réunion supprimée');
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusBadge = (status: Meeting['status'], scheduledAt: string) => {
    const now = new Date();
    const meetingTime = new Date(scheduledAt);
    
    if (status === 'in_progress') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
          En cours
        </Badge>
      );
    }
    
    if (status === 'ended') {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Terminé
        </Badge>
      );
    }
    
    if (status === 'cancelled') {
      return (
        <Badge variant="destructive">
          Annulé
        </Badge>
      );
    }
    
    // Scheduled
    if (meetingTime < now) {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-500/30">
          En retard
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-500/30">
        Programmé
      </Badge>
    );
  };

  if (isLoading) {
    return <LoadingState message="Chargement des réunions..." rows={3} />;
  }

  if (meetings.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Aucune réunion</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Créez votre première réunion libre
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map(meeting => {
        const meetingDate = new Date(meeting.scheduled_at);
        const canJoin = meeting.status === 'scheduled' || meeting.status === 'in_progress';
        
        return (
          <Card key={meeting.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
              
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{meeting.title}</h3>
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {meeting.description}
                      </p>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteMeeting(meeting.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{format(meetingDate, 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{format(meetingDate, 'HH:mm', { locale: fr })}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{meeting.duration_minutes} min</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  {getStatusBadge(meeting.status, meeting.scheduled_at)}
                  
                  {canJoin && (
                    <Button
                      size="sm"
                      onClick={() => onJoinMeeting(meeting)}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      <Play className="h-4 w-4 mr-1.5" />
                      Rejoindre
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MeetingsList;
