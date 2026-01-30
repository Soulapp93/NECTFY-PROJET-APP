import React, { useState } from 'react';
import { Video, Plus, Calendar, Clock, Play, Users, Sparkles, GraduationCap, UsersRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVirtualClasses } from '@/hooks/useVirtualClasses';
import VirtualClasses from '@/components/elearning/VirtualClasses';
import ClassHistory from '@/components/elearning/ClassHistory';
import MeetingsList from '@/components/elearning/MeetingsList';
import CreateClassModal from '@/components/elearning/modals/CreateClassModal';
import CreateMeetingModal from '@/components/elearning/modals/CreateMeetingModal';
import ScalableVideoRoom from '@/components/elearning/ScalableVideoRoom';
import HybridMeetingRoom from '@/components/elearning/HybridMeetingRoom';
import MediaPermissionDialog from '@/components/elearning/MediaPermissionDialog';
import { VirtualClass } from '@/services/virtualClassService';
import { Meeting } from '@/services/meetingService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ELearning = () => {
  const { userRole, userId } = useCurrentUser();
  const { data: virtualClasses = [], isLoading } = useVirtualClasses();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateMeetingModalOpen, setIsCreateMeetingModalOpen] = useState(false);
  const [activeClass, setActiveClass] = useState<VirtualClass | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [pendingClass, setPendingClass] = useState<VirtualClass | null>(null);
  const [pendingMeeting, setPendingMeeting] = useState<Meeting | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

  // Handle joining a class - show permission dialog first
  const handleJoinClass = (classItem: VirtualClass) => {
    setPendingClass(classItem);
    setPendingMeeting(null);
    setIsPermissionDialogOpen(true);
  };

  // Handle joining a meeting - show permission dialog first
  const handleJoinMeeting = (meeting: Meeting) => {
    setPendingMeeting(meeting);
    setPendingClass(null);
    setIsPermissionDialogOpen(true);
  };

  // Handle permission granted - join the class or meeting
  const handlePermissionGranted = async () => {
    setIsRequestingPermission(true);
    try {
      // Request media permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Permission granted, join the class or meeting
      if (pendingClass) {
        setActiveClass(pendingClass);
        setPendingClass(null);
      } else if (pendingMeeting) {
        setActiveMeeting(pendingMeeting);
        setPendingMeeting(null);
      }
      setIsPermissionDialogOpen(false);
    } catch (error) {
      console.error('Permission denied:', error);
      // Still allow joining even if permission denied (will show error in VideoRoom)
      if (pendingClass) {
        setActiveClass(pendingClass);
        setPendingClass(null);
      } else if (pendingMeeting) {
        setActiveMeeting(pendingMeeting);
        setPendingMeeting(null);
      }
      setIsPermissionDialogOpen(false);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Handle permission dialog cancel
  const handlePermissionCancel = () => {
    setPendingClass(null);
    setPendingMeeting(null);
    setIsPermissionDialogOpen(false);
  };

  // Handle leaving a class
  const handleLeaveClass = () => {
    setActiveClass(null);
  };

  // Handle leaving a meeting
  const handleLeaveMeeting = () => {
    setActiveMeeting(null);
  };

  // If user is in a meeting video room, show the hybrid meeting room (with auto-fallback)
  if (activeMeeting) {
    return (
      <HybridMeetingRoom
        meeting={activeMeeting}
        userId={userId || ''}
        userName="Participant"
        isAdmin={isAdmin}
        onLeave={handleLeaveMeeting}
      />
    );
  }

  // If user is in a class video room, show only the video room
  if (activeClass) {
    return (
      <ScalableVideoRoom
        virtualClass={activeClass}
        onLeave={handleLeaveClass}
      />
    );
  }

  // Stats for dashboard
  const todayClasses = virtualClasses?.filter(vc => 
    format(new Date(vc.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ) || [];
  
  const upcomingClasses = virtualClasses?.filter(vc => 
    new Date(vc.date) >= new Date() && vc.status === 'Programmé'
  ) || [];
  
  const liveClasses = virtualClasses?.filter(vc => vc.status === 'En cours') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                  E-Learning
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Classes virtuelles interactives en temps réel
                </p>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsCreateMeetingModalOpen(true)}
                  size="lg"
                  variant="outline"
                  className="border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                >
                  <UsersRound className="h-5 w-5 mr-2" />
                  Nouvelle réunion
                </Button>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Créer une session
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{liveClasses.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Sessions en direct</p>
              </div>
              {liveClasses.length > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-cyan-500/10 hover:from-blue-500/15 hover:to-cyan-500/15 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{todayClasses.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Aujourd'hui</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 hover:from-violet-500/15 hover:to-indigo-500/15 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{upcomingClasses.length}</p>
                <p className="text-sm text-muted-foreground font-medium">À venir</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="classes" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 backdrop-blur-sm p-1.5 rounded-xl border border-border/50">
              <TabsTrigger 
                value="classes" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"
              >
                <Video className="h-4 w-4 mr-2" />
                Classes virtuelles
              </TabsTrigger>
              <TabsTrigger 
                value="meetings" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"
              >
                <UsersRound className="h-4 w-4 mr-2" />
                Réunions
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-4 py-2.5 transition-all"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Historique
              </TabsTrigger>
            </TabsList>

            {virtualClasses.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{virtualClasses.length} session{virtualClasses.length > 1 ? 's' : ''} disponible{virtualClasses.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <TabsContent value="classes" className="mt-0">
            <VirtualClasses onJoinClass={handleJoinClass} />
          </TabsContent>

          <TabsContent value="meetings" className="mt-0">
            <MeetingsList onJoinMeeting={handleJoinMeeting} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ClassHistory />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Create Meeting Modal */}
      <CreateMeetingModal 
        isOpen={isCreateMeetingModalOpen} 
        onClose={() => setIsCreateMeetingModalOpen(false)}
      />

      {/* Media Permission Dialog */}
      <MediaPermissionDialog
        isOpen={isPermissionDialogOpen}
        onRequestPermission={handlePermissionGranted}
        onCancel={handlePermissionCancel}
        isLoading={isRequestingPermission}
      />
    </div>
  );
};

export default ELearning;