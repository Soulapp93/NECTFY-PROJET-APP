import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import ExternalDailyRoom from './ExternalDailyRoom';
import VideoRoom from './videoRoom/VideoRoom';
import { Meeting } from '@/services/meetingService';
import { toast } from 'sonner';

interface HybridMeetingRoomProps {
  meeting: Meeting;
  userId: string;
  userName: string;
  isAdmin: boolean;
  onLeave: () => void;
}

/**
 * HybridMeetingRoom - Wrapper for meetings with Daily in external tab + P2P fallback
 */
const HybridMeetingRoom: React.FC<HybridMeetingRoomProps> = ({
  meeting,
  userId,
  userName,
  isAdmin,
  onLeave,
}) => {
  const [useDaily, setUseDaily] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Automatic fallback handler when Daily fails
  const handleDailyFallback = useCallback(() => {
    console.warn('Daily.co connection failed for meeting, switching to P2P mode');
    toast.info('Basculement vers le mode P2P pour une meilleure connectivité');
    setUseDaily(false);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Préparation de la réunion...</h2>
          <p className="text-muted-foreground">Configuration du système vidéo</p>
        </div>
      </div>
    );
  }

  // Use Daily.co in external tab mode
  if (useDaily) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <ExternalDailyRoom
          virtualClassId={meeting.id}
          virtualClassTitle={meeting.title}
          userId={userId}
          userName={userName}
          isInstructor={isAdmin}
          onLeave={onLeave}
          onFallbackToP2P={handleDailyFallback}
          chatEnabled={true}
          screenShareEnabled={true}
          recordingEnabled={false}
        />
      </div>
    );
  }

  // Fallback to native WebRTC P2P (create a virtual class-like object for VideoRoom)
  const virtualClassLike = {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description || '',
    instructor_id: meeting.created_by,
    formation_id: '',
    establishment_id: meeting.establishment_id,
    date: new Date(meeting.scheduled_at).toISOString().split('T')[0],
    start_time: new Date(meeting.scheduled_at).toTimeString().slice(0, 5),
    end_time: new Date(new Date(meeting.scheduled_at).getTime() + meeting.duration_minutes * 60000).toTimeString().slice(0, 5),
    status: meeting.status === 'in_progress' ? 'En cours' : 'Programmé',
    max_participants: meeting.max_participants || 100,
    current_participants: 0,
    chat_enabled: true,
    screen_sharing_enabled: true,
    whiteboard_enabled: true,
    recording_enabled: false,
    created_at: meeting.created_at,
    updated_at: meeting.updated_at,
  };

  return <VideoRoom virtualClass={virtualClassLike as any} onLeave={onLeave} />;
};

export default HybridMeetingRoom;
