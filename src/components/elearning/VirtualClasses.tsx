import React, { useState } from 'react';
import { Search, Monitor, Calendar, Video, Edit, Trash2, XCircle, Play, Square, Users, Clock, Sparkles, BookOpen } from 'lucide-react';
import { useVirtualClasses, useDeleteVirtualClass, useJoinClass, useUpdateClassStatus } from '@/hooks/useVirtualClasses';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { VirtualClass } from '@/services/virtualClassService';
import EditClassModal from './modals/EditClassModal';
import ClassDetailsModal from './modals/ClassDetailsModal';

interface VirtualClassesProps {
  onJoinClass: (classItem: VirtualClass) => void;
}

const VirtualClasses: React.FC<VirtualClassesProps> = ({ onJoinClass }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<VirtualClass | null>(null);
  const [selectedClassForDetails, setSelectedClassForDetails] = useState<VirtualClass | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: virtualClasses = [], isLoading } = useVirtualClasses();
  const { userId: currentUserId, userRole } = useCurrentUser();
  const deleteClassMutation = useDeleteVirtualClass();
  const joinClassMutation = useJoinClass();
  const updateStatusMutation = useUpdateClassStatus();

  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
  const isInstructor = userRole === 'Formateur';

  // Filter classes
  const filteredClasses = virtualClasses.filter(cls => {
    const instructorName = cls.instructor 
      ? `${cls.instructor.first_name} ${cls.instructor.last_name}` 
      : '';
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.formation?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cls.status === selectedStatus;
    // Don't show terminated or cancelled classes here (they're in history)
    const isActiveClass = cls.status !== 'Terminé' && cls.status !== 'Annulé';
    return matchesSearch && matchesStatus && isActiveClass;
  });

  const canManageClass = (classItem: VirtualClass) => {
    return isAdmin || (isInstructor && classItem.instructor_id === currentUserId);
  };

  const getAvailableActions = (classItem: VirtualClass) => {
    const actions = [];
    
    if (canManageClass(classItem)) {
      actions.push('edit');
      
      if (classItem.status === 'Programmé') {
        actions.push('start', 'cancel');
      }
      
      if (classItem.status === 'En cours') {
        actions.push('end');
      }
      
      if (classItem.status !== 'En cours') {
        actions.push('delete');
      }
    }
    
    return actions;
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette classe ?')) {
      await deleteClassMutation.mutateAsync(classId);
    }
  };

  const handleUpdateStatus = async (classId: string, status: string) => {
    const confirmMessages = {
      'Annulé': 'Êtes-vous sûr de vouloir annuler cette classe ?',
      'En cours': 'Êtes-vous sûr de vouloir démarrer cette classe ?',
      'Terminé': 'Êtes-vous sûr de vouloir terminer cette classe ?'
    };
    
    const message = confirmMessages[status as keyof typeof confirmMessages];
    if (message && confirm(message)) {
      await updateStatusMutation.mutateAsync({ id: classId, status });
    }
  };

  const handleJoinClass = async (classItem: VirtualClass) => {
    if (classItem.status === 'En cours') {
      onJoinClass(classItem);
    } else {
      // For "Programmé" classes, check if user can join
      await joinClassMutation.mutateAsync(classItem.id);
    }
  };

  const handleEditClass = (classItem: VirtualClass) => {
    setSelectedClassForEdit(classItem);
    setIsEditModalOpen(true);
  };

  const handleShowDetails = (classItem: VirtualClass) => {
    setSelectedClassForDetails(classItem);
    setIsDetailsModalOpen(true);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'En cours':
        return { 
          bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          text: 'text-white',
          icon: Play,
          pulse: true
        };
      case 'Programmé':
        return { 
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-white',
          icon: Clock,
          pulse: false
        };
      default:
        return { 
          bg: 'bg-muted',
          text: 'text-muted-foreground',
          icon: Monitor,
          pulse: false
        };
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return "Demain";
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm bg-background/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 w-44 rounded-xl" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-6 w-3/4 mb-4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 mb-3 rounded-lg" />
                <Skeleton className="h-20 w-full mb-4 rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search and filters */}
      <Card className="border-0 shadow-sm bg-background/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par titre, formateur ou formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border/50 bg-background/80"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl border-border/50 bg-background/80">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="En cours">🟢 En cours</SelectItem>
                <SelectItem value="Programmé">🟡 Programmé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredClasses.map((classItem) => {
          const statusConfig = getStatusConfig(classItem.status);
          const StatusIcon = statusConfig.icon;
          const isLive = classItem.status === 'En cours';
          
          return (
            <Card 
              key={classItem.id} 
              className={`group relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 ${
                isLive ? 'ring-2 ring-emerald-500/50' : ''
              }`}
            >
              {/* Top gradient bar based on formation color */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r"
                style={{ 
                  background: classItem.formation?.color 
                    ? `linear-gradient(to right, ${classItem.formation.color}, ${classItem.formation.color}88)`
                    : 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.5))'
                }}
              />

              <CardContent className="p-5 pt-6">
                {/* Header with status and actions */}
                <div className="flex items-start justify-between mb-4">
                  <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0 px-3 py-1 text-xs font-medium`}>
                    {statusConfig.pulse && (
                      <span className="relative flex h-2 w-2 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    )}
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {classItem.status}
                  </Badge>
                  
                  {canManageClass(classItem) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="sr-only">Menu</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {getAvailableActions(classItem).includes('edit') && (
                          <DropdownMenuItem onClick={() => handleEditClass(classItem)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        
                        {getAvailableActions(classItem).includes('start') && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(classItem.id, 'En cours')} className="text-emerald-600">
                            <Play className="h-4 w-4 mr-2" />
                            Démarrer la session
                          </DropdownMenuItem>
                        )}
                        
                        {getAvailableActions(classItem).includes('end') && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(classItem.id, 'Terminé')}>
                            <Square className="h-4 w-4 mr-2" />
                            Terminer
                          </DropdownMenuItem>
                        )}
                        
                        {getAvailableActions(classItem).includes('cancel') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleUpdateStatus(classItem.id, 'Annulé')}
                              className="text-orange-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler la session
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {getAvailableActions(classItem).includes('delete') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClass(classItem.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Title and instructor */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {classItem.title}
                  </h3>
                  {classItem.instructor && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {classItem.instructor.first_name} {classItem.instructor.last_name}
                    </p>
                  )}
                </div>

                {/* Formation badge */}
                {classItem.formation && (
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-muted/50">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-sm" 
                      style={{ backgroundColor: classItem.formation.color }}
                    />
                    <span className="text-sm font-medium text-foreground truncate">{classItem.formation.title}</span>
                  </div>
                )}

                {/* Date and time info */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium text-foreground">{getDateLabel(classItem.date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    {classItem.start_time.substring(0, 5)} - {classItem.end_time.substring(0, 5)}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleJoinClass(classItem)}
                    className={`flex-1 h-11 rounded-xl font-medium transition-all ${
                      isLive 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                    }`}
                    disabled={joinClassMutation.isPending}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {isLive ? 'Rejoindre maintenant' : 'Participer'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-11 w-11 rounded-xl border-border/50"
                    onClick={() => handleShowDetails(classItem)}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredClasses.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Monitor className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucune classe disponible</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {virtualClasses.length === 0 
                ? "Aucune classe virtuelle n'est programmée pour vos formations actuellement."
                : "Aucune classe ne correspond à vos critères de recherche."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <EditClassModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        virtualClass={selectedClassForEdit}
      />
      
      <ClassDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        virtualClass={selectedClassForDetails}
        onJoinClass={onJoinClass}
      />
    </div>
  );
};

export default VirtualClasses;