import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useUserFormations } from '@/hooks/useUserFormations';
import { useUsers } from '@/hooks/useUsers';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: {
    name: string;
    description?: string;
    formation_id?: string;
    member_ids: string[];
  }) => Promise<void>;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formationId, setFormationId] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { userFormations } = useUserFormations();
  const { users } = useUsers();

  // Filter users by selected formation
  const availableUsers = formationId
    ? users.filter(user => 
        userFormations.some(f => f.formation_id === formationId && user.role === 'Étudiant')
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !formationId || selectedMembers.length === 0) return;

    setLoading(true);
    try {
      await onCreateGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        formation_id: formationId,
        member_ids: selectedMembers,
      });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setFormationId('');
    setSelectedMembers([]);
    onClose();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Créer un groupe privé
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du groupe *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Groupe de projet"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement le groupe..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="formation">Formation *</Label>
            <Select value={formationId} onValueChange={setFormationId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une formation" />
              </SelectTrigger>
              <SelectContent>
                {userFormations.map((assignment) => (
                  <SelectItem key={assignment.formation_id} value={assignment.formation_id}>
                    Formation {assignment.formation_id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formationId && (
            <div>
              <Label>Membres du groupe * (au moins 1)</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-border rounded-md p-3">
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun étudiant disponible dans cette formation
                  </p>
                ) : (
                  availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedMembers.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {user.first_name} {user.last_name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedMembers.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedMembers.length} membre(s) sélectionné(s)
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || !formationId || selectedMembers.length === 0}
            >
              {loading ? 'Création...' : 'Créer le groupe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
