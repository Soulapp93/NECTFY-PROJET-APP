import React, { useState } from 'react';
import { Search, Monitor, Calendar, Video, Edit, Trash2, XCircle, Play, Square } from 'lucide-react';
import { useVirtualClasses, useDeleteVirtualClass, useJoinClass, useUpdateClassStatus } from '@/hooks/useVirtualClasses';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
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

  // Toutes les classes virtuelles sont affichées - pas de filtrage par statut
  const filteredClasses = virtualClasses.filter(cls => {
    const instructorName = cls.instructor 
      ? `${cls.instructor.first_name} ${cls.instructor.last_name}` 
      : '';
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cls.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const canManageClass = (classItem: VirtualClass) => {
    return userRole === 'Administrateur principal' || 
           userRole === 'Administrateur' || 
           (userRole === 'Formateur' && classItem.instructor_id === currentUserId);
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
      // Join the class first if not already joined
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'bg-success text-success-foreground';
      case 'Programmé':
        return 'bg-warning text-warning-foreground';
      case 'Terminé':
        return 'bg-muted text-muted-foreground';
      case 'Annulé':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex space-x-2 mt-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Programmé">Programmé</SelectItem>
                <SelectItem value="Terminé">Terminé</SelectItem>
                <SelectItem value="Annulé">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classItem) => (
          <Card key={classItem.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {classItem.title}
                  </h3>
                  {classItem.instructor && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Par {classItem.instructor.first_name} {classItem.instructor.last_name}
                    </p>
                  )}
                  <Badge className={getStatusColor(classItem.status)}>
                    {classItem.status}
                  </Badge>
                </div>
                
                {canManageClass(classItem) && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {getAvailableActions(classItem).includes('edit') && (
                          <DropdownMenuItem onClick={() => handleEditClass(classItem)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        
                        {getAvailableActions(classItem).includes('start') && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(classItem.id, 'En cours')}>
                            <Play className="h-4 w-4 mr-2" />
                            Démarrer
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
                              Annuler
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
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {classItem.description && (
                <p className="text-sm text-muted-foreground">
                  {classItem.description}
                </p>
              )}

              {classItem.formation && (
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: classItem.formation.color }}
                  />
                  <span className="text-sm font-medium">{classItem.formation.title}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(classItem.date), 'dd MMMM yyyy', { locale: fr })} • {classItem.start_time.substring(0, 5)} - {classItem.end_time.substring(0, 5)}
                </div>
                {classItem.recording_enabled && (
                  <div className="flex items-center text-sm text-destructive">
                    <Video className="h-4 w-4 mr-2" />
                    Enregistrement activé
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => handleJoinClass(classItem)}
                  className="flex-1"
                  disabled={joinClassMutation.isPending || classItem.status === 'Terminé' || classItem.status === 'Annulé'}
                  variant={classItem.status === 'En cours' ? 'default' : 'outline'}
                >
                  {classItem.status === 'En cours' ? 'Rejoindre' : 
                   classItem.status === 'Programmé' ? 'S\'inscrire' :
                   classItem.status === 'Terminé' ? 'Terminé' : 'Annulé'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShowDetails(classItem)}
                >
                  Détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune classe trouvée</h3>
            <p className="text-muted-foreground">
              {virtualClasses.length === 0 
                ? "Aucune classe virtuelle créée pour le moment."
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