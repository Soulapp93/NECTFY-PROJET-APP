
import React from 'react';
import { Users, BookOpen, User, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface FormationCardProps {
  id: number;
  title: string;
  level: string;
  students: number;
  modules: number;
  instructor: string;
  status: 'Actif' | 'Inactif' | 'Brouillon';
  color: string;
  description?: string;
  duration?: string;
  maxStudents?: string;
  isAdmin?: boolean;
}

const FormationCard: React.FC<FormationCardProps> = ({
  title,
  level,
  students,
  modules,
  instructor,
  status,
  color,
  description,
  duration,
  maxStudents,
  isAdmin = false
}) => {
  return (
    <div className="course-card rounded-xl overflow-hidden floating-card shadow-sm hover:shadow-md transition-all">
      <div className="h-36 sm:h-40 relative" style={{ backgroundColor: color }}>
        <div className="absolute top-4 right-4">
          <StatusBadge status={status} type="formation" />
        </div>
        <div className="absolute bottom-4 left-5 text-primary-foreground">
          <h3 className="font-semibold text-lg sm:text-xl mb-1">{level}</h3>
        </div>
      </div>
      
      <div className="p-5 sm:p-6 lg:p-7">
        <h3 className="font-semibold text-foreground mb-3 text-lg sm:text-xl">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm sm:text-base mb-5 line-clamp-2">{description}</p>
        )}
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm sm:text-base text-muted-foreground">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0" />
            {students} étudiant{students > 1 ? 's' : ''} inscrit{students > 1 ? 's' : ''}
          </div>
          <div className="flex items-center text-sm sm:text-base text-muted-foreground">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0" />
            {modules} module{modules > 1 ? 's' : ''}
          </div>
          <div className="flex items-center text-sm sm:text-base text-muted-foreground">
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0" />
            {instructor}
          </div>
          {duration && (
            <div className="flex items-center text-sm sm:text-base text-muted-foreground">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-3 flex-shrink-0" />
              {duration}h de formation
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button className="text-primary hover:text-primary/80 text-sm sm:text-base font-medium transition-colors text-left">
            Voir détails
          </button>
          {isAdmin && (
            <div className="flex gap-2 sm:gap-3">
              <button className="flex-1 sm:flex-none px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                Modifier
              </button>
              <button className="flex-1 sm:flex-none px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Gérer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormationCard;
