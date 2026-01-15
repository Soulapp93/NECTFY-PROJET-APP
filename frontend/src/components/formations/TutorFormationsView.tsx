import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  GraduationCap,
  Eye,
  Clock,
  Grid3x3,
  List,
  Users
} from 'lucide-react';
import { useTutorFormations } from '@/hooks/useTutorFormations';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const TutorFormationsView: React.FC = () => {
  const { loading, error, getUniqueFormations } = useTutorFormations();
  const navigate = useNavigate();
  const formations = getUniqueFormations();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif':
        return 'bg-green-100 text-green-800';
      case 'Inactif':
        return 'bg-red-100 text-red-800';
      case 'Brouillon':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'BAC+1': 'bg-purple-100 text-purple-800',
      'BAC+2': 'bg-blue-100 text-blue-800',
      'BAC+3': 'bg-green-100 text-green-800',
      'BAC+4': 'bg-orange-100 text-orange-800',
      'BAC+5': 'bg-red-100 text-red-800',
      'Intermédiaire': 'bg-purple-100 text-purple-800',
      'Débutant': 'bg-blue-100 text-blue-800',
      'Avancé': 'bg-green-100 text-green-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (formations.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucune formation trouvée</h3>
        <p className="text-muted-foreground">
          Vous n'avez actuellement aucun apprenti assigné à des formations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec toggle vue */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            Formation de mon apprenti
          </h2>
          <p className="text-muted-foreground text-sm">
            Suivez les formations de vos apprentis et accédez aux détails
          </p>
        </div>
        
        {/* Toggle vue grille/liste */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-3"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Vue Grille - Même design que FormationCard étudiant mais SANS bouton participants */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => {
            const formationColor = formation.formation_color || '#8B5CF6';
            
            return (
              <div 
                key={formation.formation_id} 
                className="bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow duration-200 group"
              >
                {/* Barre de couleur en haut */}
                <div 
                  className="h-1.5 sm:h-2 rounded-t-xl" 
                  style={{ backgroundColor: formationColor }}
                />
                
                <div className="p-3 sm:p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getLevelColor(formation.formation_level)}`}>
                          {formation.formation_level}
                        </span>
                        <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor('Actif')}`}>
                          Actif
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-2">
                        {formation.formation_title}
                      </h3>
                      {formation.formation_description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {formation.formation_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="space-y-1.5 sm:space-y-2 mb-3">
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
                      <span className="truncate">
                        Du {new Date(formation.formation_start_date).toLocaleDateString('fr-FR')} au {new Date(formation.formation_end_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
                      <span>{formation.formation_duration}h de formation</span>
                    </div>
                  </div>

                  {/* Modules */}
                  <div className="border-t border-border pt-2 sm:pt-3 mb-2 sm:mb-3">
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
                      <span>{formation.modules_count || 0} module{(formation.modules_count || 0) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Liste des apprentis */}
                  <div className="border-t border-border pt-2 sm:pt-3 mb-2 sm:mb-3">
                    <div className="flex items-start gap-1">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/70 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        {formation.students.map((student: any) => (
                          <span 
                            key={student.id}
                            className="text-xs sm:text-sm text-foreground flex items-center gap-1.5"
                          >
                            <span className="font-medium">Apprenti :</span>
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              {student.first_name} {student.last_name}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button - SANS bouton participants pour tuteur */}
                  <div className="flex gap-2 pt-2 sm:pt-3 border-t border-border">
                    <button
                      onClick={() => navigate(`/formations/${formation.formation_id}`)}
                      className="flex-1 flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-primary-foreground rounded-lg sm:rounded-xl transition-colors active:scale-[0.98]"
                      style={{ backgroundColor: formationColor }}
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Détail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vue Liste */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Niveau</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Formation</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dates</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Durée</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Modules</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Apprentis</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formations.map((formation, index) => (
                  <tr 
                    key={formation.formation_id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className="font-medium"
                        style={{ borderColor: formation.formation_color, color: formation.formation_color }}
                      >
                        {formation.formation_level}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{formation.formation_title}</div>
                        {formation.formation_description && (
                          <div className="text-sm text-gray-600 line-clamp-1 mt-1">
                            {formation.formation_description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Du {new Date(formation.formation_start_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-gray-600">
                          au {new Date(formation.formation_end_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formation.formation_duration}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {formation.modules_count || 0} module{(formation.modules_count || 0) > 1 ? 's' : ''}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {formation.students.map((s: any) => `${s.first_name} ${s.last_name}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate(`/formations/${formation.formation_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
