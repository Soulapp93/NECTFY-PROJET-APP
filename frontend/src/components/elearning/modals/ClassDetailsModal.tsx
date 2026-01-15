import React from 'react';
import { X, Calendar, Clock, Users, Video, Monitor, User, BookOpen } from 'lucide-react';
import { VirtualClass } from '@/services/virtualClassService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  virtualClass: VirtualClass | null;
  onJoinClass?: (classItem: VirtualClass) => void;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  virtualClass, 
  onJoinClass 
}) => {
  if (!virtualClass) return null;

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

  const handleJoinClass = () => {
    if (onJoinClass) {
      onJoinClass(virtualClass);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>{virtualClass.title}</span>
          </DialogTitle>
          <DialogDescription>
            Détails de la classe virtuelle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and basic info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge className={getStatusColor(virtualClass.status)}>
                  {virtualClass.status}
                </Badge>
                {virtualClass.recording_enabled && (
                  <div className="flex items-center text-sm text-destructive">
                    <Video className="h-4 w-4 mr-1" />
                    Enregistrement activé
                  </div>
                )}
              </div>

              {virtualClass.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <p className="text-sm">{virtualClass.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Date:</span>
                    <span>{format(new Date(virtualClass.date), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Heure:</span>
                    <span>{virtualClass.start_time.substring(0, 5)} - {virtualClass.end_time.substring(0, 5)}</span>
                  </div>
                </div>

              <div className="space-y-3">
                {virtualClass.instructor && (
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Formateur:</span>
                    <span>{virtualClass.instructor.first_name} {virtualClass.instructor.last_name}</span>
                  </div>
                )}
                
                {virtualClass.formation && (
                  <div className="flex items-center text-sm">
                    <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium mr-2">Formation:</span>
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: virtualClass.formation.color }}
                      />
                      <span>{virtualClass.formation.title}</span>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials if any */}
          {virtualClass.materials && Array.isArray(virtualClass.materials) && virtualClass.materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ressources du cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {virtualClass.materials.map((material: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{material.name || `Ressource ${index + 1}`}</span>
                      <Button variant="outline" size="sm">
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fermer
            </Button>
            {virtualClass.status === 'En cours' && onJoinClass && (
              <Button
                onClick={handleJoinClass}
                className="flex-1"
              >
                <Video className="h-4 w-4 mr-2" />
                Rejoindre la classe
              </Button>
            )}
            {virtualClass.status === 'Programmé' && onJoinClass && (
              <Button
                onClick={handleJoinClass}
                variant="outline"
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                S'inscrire
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClassDetailsModal;