
import React, { useState, useEffect } from 'react';
import { Search, Plus, Grid3x3, List, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateFormationModal from './CreateFormationModal';
import EditFormationModal from './EditFormationModal';
import FormationCard from './FormationCard';
import FormationParticipantsModal from './FormationParticipantsModal';
import { formationService } from '@/services/formationService';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const FormationsList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [editingFormationId, setEditingFormationId] = useState<string | null>(null);
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { userRole } = useCurrentUser();
  const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const data = await formationService.getAllFormations();
      
      // Récupérer le nombre de participants pour chaque formation
      const formationsWithParticipants = await Promise.all(
        (data || []).map(async (formation) => {
          const participantsCount = await formationService.getFormationParticipantsCount(formation.id);
          return {
            ...formation,
            participantsCount
          };
        })
      );
      
      setFormations(formationsWithParticipants);
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
      toast.error('Erreur lors du chargement des formations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormations();
  }, []);

  const handleCreateFormation = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditFormation = (formationId: string) => {
    setEditingFormationId(formationId);
    setIsEditModalOpen(true);
  };

  const handleViewParticipants = (formationId: string) => {
    setSelectedFormationId(formationId);
    setIsParticipantsModalOpen(true);
  };

  const handleSuccess = () => {
    fetchFormations();
    toast.success('Formation mise à jour avec succès');
  };

  const handleCreateSuccess = () => {
    fetchFormations();
    toast.success('Formation créée avec succès');
  };

  const handleDeleteFormation = async (formationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette formation ? Cette action supprimera également tous les modules associés et ne peut pas être annulée.')) {
      try {
        await formationService.deleteFormation(formationId);
        toast.success('Formation supprimée avec succès');
        fetchFormations();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression de la formation');
      }
    }
  };

  const filteredFormations = formations.filter(formation => {
    const matchesSearch = formation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formation.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || formation.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || formation.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  if (loading) {
    return (
      <LoadingState message="Chargement des formations..." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl shadow-lg border-2 border-primary/20">
        <div className="p-5 sm:p-6 lg:p-8 border-b border-primary/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Gestion des formations</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
              
              {isAdmin && (
                <Button 
                  onClick={handleCreateFormation}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                  variant="premium"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">Nouveau</span>
                  <span className="xs:hidden">Nouveau</span>
                </Button>
              )}
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
                <SelectItem value="BAC+1">BAC+1</SelectItem>
                <SelectItem value="BAC+2">BAC+2</SelectItem>
                <SelectItem value="BAC+3">BAC+3</SelectItem>
                <SelectItem value="BAC+4">BAC+4</SelectItem>
                <SelectItem value="BAC+5">BAC+5</SelectItem>
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
      </div>

      {/* Cartes des formations ou vue liste */}
      {filteredFormations.length === 0 ? (
        <EmptyState
          icon={Plus}
          title={searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all' 
            ? 'Aucune formation trouvée' 
            : 'Aucune formation'}
          description={searchTerm || selectedLevel !== 'all' || selectedStatus !== 'all'
            ? 'Essayez de modifier vos critères de recherche.'
            : 'Créez votre première formation pour enrichir votre catalogue.'}
          action={(isAdmin && !searchTerm && selectedLevel === 'all' && selectedStatus === 'all') ? {
            label: 'Créer une formation',
            onClick: handleCreateFormation,
            variant: 'premium'
          } : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation) => (
            <FormationCard
              key={formation.id}
              {...formation}
              modules={formation.formation_modules || []}
              onEdit={isAdmin ? () => handleEditFormation(formation.id) : undefined}
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
                              onClick={() => handleEditFormation(formation.id)}
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
          formationTitle={formations.find(f => f.id === selectedFormationId)?.title || ''}
          formationColor={formations.find(f => f.id === selectedFormationId)?.color}
        />
      )}
    </div>
  );
};

export default FormationsList;
