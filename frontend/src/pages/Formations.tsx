import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Clock, Star, Grid3x3, List, GraduationCap } from 'lucide-react';
import FormationCard from '../components/administration/FormationCard';
import CreateFormationModal from '@/components/administration/CreateFormationModal';
import EditFormationModal from '@/components/administration/EditFormationModal';
import FormationParticipantsModal from '@/components/administration/FormationParticipantsModal';
import { useFormations } from '@/hooks/useFormations';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TutorFormationsView } from '@/components/formations/TutorFormationsView';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Formations = () => {
  const { userRole } = useCurrentUser();
  
  // Si c'est un tuteur, afficher la vue tuteur spécifique
  if (userRole === 'Tuteur') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-h-screen">
        <PageHeader 
          title="Formations Apprenti"
          description="Suivez les formations de votre apprenti"
          icon={GraduationCap}
        />
        <TutorFormationsView />
      </div>
    );
  }
  
  return <FormationsContent userRole={userRole} />;
};

const FormationsContent = ({ userRole }: { userRole: string | null }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFormationId, setEditingFormationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [formationsWithParticipants, setFormationsWithParticipants] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  
  const { formations, loading, error, refetch } = useFormations();
  
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

  const fetchParticipantsCount = async () => {
    if (formations && formations.length > 0) {
      const formationsWithCounts = await Promise.all(
        formations.map(async (formation) => {
          const participantsCount = await formationService.getFormationParticipantsCount(formation.id);
          return {
            ...formation,
            participantsCount
          };
        })
      );
      setFormationsWithParticipants(formationsWithCounts);
    }
  };

  // Récupérer le nombre de participants pour chaque formation
  useEffect(() => {
    fetchParticipantsCount();
  }, [formations]);

  const handleCreateFormation = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditFormation = (formation: any) => {
    setEditingFormationId(formation.id);
    setIsEditModalOpen(true);
  };

  const handleDeleteFormation = async (formationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
      try {
        await formationService.deleteFormation(formationId);
        toast.success('Formation supprimée avec succès');
        refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la formation');
      }
    }
  };

  const handleViewParticipants = (formationId: string) => {
    setSelectedFormationId(formationId);
    setIsParticipantsModalOpen(true);
  };

  const handleSuccess = () => {
    refetch();
    toast.success('Formation mise à jour avec succès');
  };

  const handleCreateSuccess = () => {
    refetch();
    toast.success('Formation créée avec succès');
  };

  const filteredFormations = formationsWithParticipants.filter(formation => {
    const matchesSearch = formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || formation.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || formation.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const levels = ['BAC+1', 'BAC+2', 'BAC+3', 'BAC+4', 'BAC+5'];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Erreur: {error}</div>
        <button onClick={refetch} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-h-screen">
      {/* Header */}
      <PageHeader 
        title="Formations"
        description="Découvrez notre catalogue de formations"
        icon={GraduationCap}
      />

      {/* Filters */}
      <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20 p-5 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Catalogue des formations</h2>
          </div>
          
          {/* Toggle vue grille/liste */}
          <div className="flex items-center bg-muted rounded-xl p-1 border border-primary/10">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3 rounded-lg"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3 rounded-lg"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[180px] border-2 border-primary/30 rounded-xl">
              <SelectValue placeholder="Tous les niveaux" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {levels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px] border-2 border-primary/30 rounded-xl">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Actif">Actif</SelectItem>
              <SelectItem value="Inactif">Inactif</SelectItem>
              <SelectItem value="Brouillon">Brouillon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Formations Grid ou Liste */}
      {filteredFormations.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 sm:p-10 lg:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' 
                ? 'Aucune formation trouvée' 
                : 'Aucune formation'
              }
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              {searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all'
                ? 'Essayez de modifier vos critères de recherche.'
                : 'Aucune formation disponible pour le moment.'
              }
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredFormations.map((formation) => (
            <FormationCard
              key={formation.id}
              {...formation}
              modules={formation.formation_modules || []}
              onEdit={isAdmin ? () => handleEditFormation(formation) : undefined}
              onDelete={isAdmin ? () => handleDeleteFormation(formation.id) : undefined}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary/5 border-b border-primary/10">
                <tr>
                  <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Formation</th>
                  <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Dates</th>
                  <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Durée</th>
                  <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Participants</th>
                  <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Modules</th>
                  <th className="px-6 py-3.5 text-left text-sm font-medium text-primary/80">Statut</th>
                  <th className="px-6 py-3.5 text-right text-sm font-medium text-primary/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFormations.map((formation) => (
                  <tr 
                    key={formation.id} 
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-1 h-14 rounded-full flex-shrink-0"
                          style={{ backgroundColor: formation.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline"
                              className="font-medium text-xs rounded-md px-2 py-0.5"
                              style={{ 
                                borderColor: formation.color, 
                                color: formation.color,
                                backgroundColor: `${formation.color}10`
                              }}
                            >
                              {formation.level}
                            </Badge>
                          </div>
                          <div className="font-medium text-foreground">{formation.title}</div>
                          {formation.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-[250px]">
                              {formation.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        <div>Du {new Date(formation.start_date).toLocaleDateString('fr-FR')}</div>
                        <div>au {new Date(formation.end_date).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">{formation.duration}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className="bg-primary/5 text-primary border-primary/20 rounded-md"
                      >
                        {formation.participantsCount || 0} / {formation.max_students}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className="bg-muted/50 text-muted-foreground border-border rounded-md"
                      >
                        {formation.formation_modules?.length || 0} modules
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className={formation.status === 'Actif' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 rounded-md' 
                          : 'bg-muted text-muted-foreground border-border rounded-md'
                        }
                      >
                        {formation.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/formations/${formation.id}`}
                          className="text-xs h-8 border-border hover:bg-muted"
                        >
                          Voir détail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewParticipants(formation.id)}
                          className="text-xs h-8 border-border hover:bg-muted"
                        >
                          Voir les participants ({formation.participantsCount || 0})
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditFormation(formation)}
                              className="text-xs h-8 border-border hover:bg-muted"
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFormation(formation.id)}
                              className="text-xs h-8"
                            >
                              Supprimer
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modals */}
      <CreateFormationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditFormationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFormationId(null);
        }}
        onSuccess={handleSuccess}
        formationId={editingFormationId}
      />

      {selectedFormationId && (
        <FormationParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => {
            setIsParticipantsModalOpen(false);
            setSelectedFormationId(null);
          }}
          formationId={selectedFormationId}
          formationTitle={filteredFormations.find(f => f.id === selectedFormationId)?.title || ''}
          formationColor={filteredFormations.find(f => f.id === selectedFormationId)?.color}
        />
      )}
    </div>
  );
};

export default Formations;
