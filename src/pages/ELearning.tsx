import React, { useState } from 'react';
import { Video, Plus, Calendar, Clock, Play, Settings, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVirtualClasses } from '@/hooks/useVirtualClasses';
import VirtualClasses from '@/components/elearning/VirtualClasses';
import ClassHistory from '@/components/elearning/ClassHistory';
import Recordings from '@/components/elearning/Recordings';
import Materials from '@/components/elearning/Materials';
import CreateClassModal from '@/components/elearning/modals/CreateClassModal';
import VideoRoom from '@/components/elearning/videoRoom/VideoRoom';
import { VirtualClass } from '@/services/virtualClassService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ELearning = () => {
  const { userRole, userId } = useCurrentUser();
  const { data: virtualClasses = [], isLoading } = useVirtualClasses();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeClass, setActiveClass] = useState<VirtualClass | null>(null);
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

  // Handle joining a class
  const handleJoinClass = (classItem: VirtualClass) => {
    setActiveClass(classItem);
  };

  // Handle leaving a class
  const handleLeaveClass = () => {
    setActiveClass(null);
  };

  // If user is in a video room, show only the video room
  if (activeClass) {
    return (
      <VideoRoom
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
    new Date(vc.date) >= new Date() && vc.status === 'scheduled'
  ) || [];
  
  const liveClasses = virtualClasses?.filter(vc => vc.status === 'En cours') || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Video className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">E-Learning</h1>
                <p className="text-muted-foreground text-sm">
                  Classes virtuelles et ressources pédagogiques
                </p>
              </div>
            </div>
            
            {isAdmin && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une session
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-200/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Play className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{liveClasses.length}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todayClasses.length}</p>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingClasses.length}</p>
                <p className="text-sm text-muted-foreground">À venir</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="classes" className="data-[state=active]:bg-background">
              <Video className="h-4 w-4 mr-2" />
              Classes virtuelles
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background">
              <Calendar className="h-4 w-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="recordings" className="data-[state=active]:bg-background">
              <Play className="h-4 w-4 mr-2" />
              Enregistrements
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-background">
              <Settings className="h-4 w-4 mr-2" />
              Ressources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classes">
            <VirtualClasses onJoinClass={handleJoinClass} />
          </TabsContent>

          <TabsContent value="history">
            <ClassHistory />
          </TabsContent>

          <TabsContent value="recordings">
            <Recordings />
          </TabsContent>

          <TabsContent value="materials">
            <Materials />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ELearning;
