import React, { useState } from 'react';
import { Users, UserPlus, UserMinus, Search, Filter, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'Étudiant' | 'Formateur' | 'Admin';
  status: 'Inscrit' | 'Présent' | 'Absent' | 'En attente';
  joinedAt?: string;
  leftAt?: string;
  avatar?: string;
}

interface ParticipantsManagementProps {
  classId: string;
  participants: Participant[];
  onAddParticipant?: () => void;
  onRemoveParticipant?: (participantId: string) => void;
  onUpdateStatus?: (participantId: string, status: string) => void;
}

const ParticipantsManagement: React.FC<ParticipantsManagementProps> = ({
  classId,
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Présent':
        return 'bg-success text-success-foreground';
      case 'Inscrit':
        return 'bg-primary text-primary-foreground';
      case 'Absent':
        return 'bg-destructive text-destructive-foreground';
      case 'En attente':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Participants ({participants.length})
            </div>
            {onAddParticipant && (
              <Button onClick={onAddParticipant} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un participant
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un participant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Inscrit">Inscrit</SelectItem>
                <SelectItem value="Présent">Présent</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Participants List */}
          <div className="space-y-2">
            {filteredParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-sm text-muted-foreground">{participant.email}</div>
                    <div className="text-xs text-muted-foreground">{participant.role}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(participant.status)}>
                    {participant.status}
                  </Badge>
                  
                  {participant.joinedAt && (
                    <div className="text-xs text-muted-foreground">
                      Rejoint: {new Date(participant.joinedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  
                  {onUpdateStatus && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onUpdateStatus(participant.id, 'Présent')}>
                          Marquer présent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(participant.id, 'Absent')}>
                          Marquer absent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(participant.id, 'En attente')}>
                          Mettre en attente
                        </DropdownMenuItem>
                        {onRemoveParticipant && (
                          <DropdownMenuItem 
                            onClick={() => onRemoveParticipant(participant.id)}
                            className="text-destructive"
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Retirer du cours
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredParticipants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun participant trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipantsManagement;