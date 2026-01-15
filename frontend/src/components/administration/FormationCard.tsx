import React, { useState } from 'react';
import { BookOpen, Users, Clock, Calendar, User, Edit, Trash2, Eye } from 'lucide-react';
import { Formation } from '@/services/formationService';
import { useNavigate } from 'react-router-dom';
import FormationParticipantsModal from './FormationParticipantsModal';

interface FormationCardProps extends Formation {
  modules?: Array<{
    id: string;
    title: string;
    duration_hours: number;
    module_instructors?: Array<{
      instructor: {
        id: string;
        first_name: string;
        last_name: string;
      };
    }>;
  }>;
  participantsCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

const FormationCard: React.FC<FormationCardProps> = ({
  id,
  title,
  description,
  level,
  status,
  start_date,
  end_date,
  max_students,
  duration,
  price,
  color = '#8B5CF6',
  modules = [],
  participantsCount = 0,
  onEdit,
  onDelete,
  isAdmin = true
}) => {
  const navigate = useNavigate();
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);

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
    const colors = {
      'BAC+1': 'bg-purple-100 text-purple-800',
      'BAC+2': 'bg-blue-100 text-blue-800',
      'BAC+3': 'bg-green-100 text-green-800',
      'BAC+4': 'bg-orange-100 text-orange-800',
      'BAC+5': 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const uniqueInstructors = modules.flatMap(module => 
    (module.module_instructors || []).map(mi => mi.instructor)
  ).reduce((acc, instructor) => {
    if (!acc.find(i => i.id === instructor.id)) {
      acc.push(instructor);
    }
    return acc;
  }, [] as Array<{ id: string; first_name: string; last_name: string; }>);

  const handleViewDetail = () => {
    navigate(`/formations/${id}?from=administration`);
  };

  const handleViewParticipants = () => {
    setIsParticipantsModalOpen(true);
  };

  return (
    <>
      <div className="bg-card rounded-2xl shadow-sm border-2 border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all duration-200 group overflow-hidden">
        {/* Barre de couleur en haut */}
        <div 
          className="h-2 sm:h-2.5" 
          style={{ backgroundColor: color }}
        />
        
        <div className="p-3 sm:p-4">
          {/* Header avec actions */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getLevelColor(level)}`}>
                  {level}
                </span>
                <span className={`px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-2">{title}</h3>
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>
              )}
            </div>
            
            {isAdmin && (
              <div className="flex space-x-1 sm:space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-info hover:bg-info/10 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="space-y-1.5 sm:space-y-2 mb-3">
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
              <span className="truncate">Du {new Date(start_date).toLocaleDateString('fr-FR')} au {new Date(end_date).toLocaleDateString('fr-FR')}</span>
            </div>
            
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
              <span>{duration}h de formation</span>
            </div>
          </div>

          {/* Modules */}
          <div className="border-t border-border pt-2 sm:pt-3 mb-2 sm:mb-3">
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground/70 flex-shrink-0" />
              <span>{modules.length} module{modules.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Formateurs */}
          {uniqueInstructors.length > 0 && (
            <div className="border-t border-border pt-2 sm:pt-3 mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-medium text-foreground">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1" />
                Formateurs:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {uniqueInstructors.slice(0, 2).map(instructor => (
                  <span 
                    key={instructor.id}
                    className="text-[10px] sm:text-xs bg-muted text-muted-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                  >
                    {instructor.first_name} {instructor.last_name}
                  </span>
                ))}
                {uniqueInstructors.length > 2 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    +{uniqueInstructors.length - 2} autre(s)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 sm:pt-3 border-t border-border">
            <button
              onClick={handleViewParticipants}
              className="flex-1 flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg sm:rounded-xl transition-colors active:scale-[0.98]"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Participants</span> ({participantsCount})
            </button>
            <button
              onClick={handleViewDetail}
              className="flex-1 flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-primary-foreground rounded-lg sm:rounded-xl transition-colors active:scale-[0.98]"
              style={{ backgroundColor: color }}
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Détail
            </button>
          </div>
        </div>
      </div>

      {/* Participants Modal */}
      <FormationParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        formationId={id}
        formationTitle={title}
        formationColor={color}
      />
    </>
  );
};

// Helper functions
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
  const colors = {
    'BAC+1': 'bg-purple-100 text-purple-800',
    'BAC+2': 'bg-blue-100 text-blue-800',
    'BAC+3': 'bg-green-100 text-green-800',
    'BAC+4': 'bg-orange-100 text-orange-800',
    'BAC+5': 'bg-red-100 text-red-800'
  };
  return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export default FormationCard;
