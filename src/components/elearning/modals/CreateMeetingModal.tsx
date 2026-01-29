import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Users, GraduationCap, User, Briefcase, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useUsers } from '@/hooks/useUsers';
import { useFormations } from '@/hooks/useFormations';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { meetingService, CreateMeetingData } from '@/services/meetingService';
import { format } from 'date-fns';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ParticipantType = 'individual' | 'formation' | 'role';

interface SelectedParticipant {
  type: ParticipantType;
  id: string;
  label: string;
  userId?: string;
  formationId?: string;
  role?: string;
}

const ROLES = [
  { value: 'Formateur', label: 'Formateurs' },
  { value: 'Étudiant', label: 'Étudiants' },
  { value: 'Admin', label: 'Administrateurs' },
];

const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();
  const { establishment } = useEstablishment();
  const { users = [] } = useUsers();
  const { formations = [] } = useFormations();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [duration, setDuration] = useState('60');
  const [participants, setParticipants] = useState<SelectedParticipant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection states
  const [selectionMode, setSelectionMode] = useState<ParticipantType | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleAddParticipants = () => {
    if (!selectionMode || selectedItems.length === 0) return;

    const newParticipants: SelectedParticipant[] = [];

    selectedItems.forEach(itemId => {
      // Check if already added
      const exists = participants.some(p => 
        (selectionMode === 'individual' && p.userId === itemId) ||
        (selectionMode === 'formation' && p.formationId === itemId) ||
        (selectionMode === 'role' && p.role === itemId)
      );

      if (exists) return;

      if (selectionMode === 'individual') {
        const user = users.find(u => u.id === itemId);
        if (user) {
          newParticipants.push({
            type: 'individual',
            id: `user-${itemId}`,
            label: `${user.first_name} ${user.last_name}`,
            userId: itemId,
          });
        }
      } else if (selectionMode === 'formation') {
        const formation = formations.find(f => f.id === itemId);
        if (formation) {
          newParticipants.push({
            type: 'formation',
            id: `formation-${itemId}`,
            label: formation.title,
            formationId: itemId,
          });
        }
      } else if (selectionMode === 'role') {
        const role = ROLES.find(r => r.value === itemId);
        if (role) {
          newParticipants.push({
            type: 'role',
            id: `role-${itemId}`,
            label: role.label,
            role: itemId,
          });
        }
      }
    });

    setParticipants([...participants, ...newParticipants]);
    setSelectedItems([]);
    setSelectionMode(null);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Veuillez saisir un titre');
      return;
    }

    if (!establishment?.id || !userId) {
      toast.error('Erreur: établissement ou utilisateur non trouvé');
      return;
    }

    setIsSubmitting(true);

    try {
      const meetingData: CreateMeetingData = {
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: new Date(scheduledDate).toISOString(),
        duration_minutes: parseInt(duration),
        participants: participants.map(p => ({
          type: p.type,
          userId: p.userId,
          formationId: p.formationId,
          role: p.role,
        })),
      };

      await meetingService.createMeeting(establishment.id, userId, meetingData);
      
      toast.success('Réunion créée avec succès');
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Erreur lors de la création de la réunion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScheduledDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setDuration('60');
    setParticipants([]);
    setSelectionMode(null);
    setSelectedItems([]);
  };

  const getParticipantIcon = (type: ParticipantType) => {
    switch (type) {
      case 'individual': return <User className="h-3 w-3" />;
      case 'formation': return <GraduationCap className="h-3 w-3" />;
      case 'role': return <Briefcase className="h-3 w-3" />;
    }
  };

  const getParticipantColor = (type: ParticipantType) => {
    switch (type) {
      case 'individual': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'formation': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'role': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Créer une réunion libre
          </DialogTitle>
          <DialogDescription>
            Planifiez une visioconférence avec les participants de votre choix
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la réunion *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Point hebdomadaire, Formation continue..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'objectif de cette réunion..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date et heure *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durée</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                    <SelectItem value="180">3 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="flex-1 overflow-hidden flex flex-col space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({participants.length})
              </Label>
              
              {!selectionMode && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode('individual')}
                    className="text-xs"
                  >
                    <User className="h-3 w-3 mr-1" />
                    Individus
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode('formation')}
                    className="text-xs"
                  >
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Formation
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectionMode('role')}
                    className="text-xs"
                  >
                    <Briefcase className="h-3 w-3 mr-1" />
                    Rôle
                  </Button>
                </div>
              )}
            </div>

            {/* Selection Panel */}
            {selectionMode && (
              <Card className="border-primary/50">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Sélectionner des {selectionMode === 'individual' ? 'utilisateurs' : selectionMode === 'formation' ? 'formations' : 'rôles'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectionMode(null); setSelectedItems([]); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {selectionMode === 'individual' && users.map(user => (
                        <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer">
                          <Checkbox
                            checked={selectedItems.includes(user.id)}
                            onCheckedChange={() => handleToggleItem(user.id)}
                          />
                          <span className="text-sm">{user.first_name} {user.last_name}</span>
                          <Badge variant="outline" className="text-xs ml-auto">{user.role}</Badge>
                        </label>
                      ))}
                      
                      {selectionMode === 'formation' && formations.map(formation => (
                        <label key={formation.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer">
                          <Checkbox
                            checked={selectedItems.includes(formation.id)}
                            onCheckedChange={() => handleToggleItem(formation.id)}
                          />
                          <span className="text-sm">{formation.title}</span>
                          <Badge variant="outline" className="text-xs ml-auto">{formation.level}</Badge>
                        </label>
                      ))}
                      
                      {selectionMode === 'role' && ROLES.map(role => (
                        <label key={role.value} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer">
                          <Checkbox
                            checked={selectedItems.includes(role.value)}
                            onCheckedChange={() => handleToggleItem(role.value)}
                          />
                          <span className="text-sm">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddParticipants}
                    disabled={selectedItems.length === 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter ({selectedItems.length})
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Selected Participants */}
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {participants.map(p => (
                  <Badge
                    key={p.id}
                    variant="outline"
                    className={`${getParticipantColor(p.type)} flex items-center gap-1.5 pr-1`}
                  >
                    {getParticipantIcon(p.type)}
                    {p.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="ml-1 hover:bg-foreground/10 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {participants.length === 0 && !selectionMode && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ajoutez des participants en cliquant sur les boutons ci-dessus
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { onClose(); resetForm(); }}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Créer la réunion
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeetingModal;
