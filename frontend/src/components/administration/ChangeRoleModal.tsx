import React, { useState } from 'react';
import { X, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: { id: string; email: string; first_name: string; last_name: string; role: string }[];
  onSave: (userId: string, newRole: string) => Promise<void>;
}

const roles = [
  { value: 'Admin', label: 'Administrateur', description: 'Peut gérer les utilisateurs et les formations' },
  { value: 'Formateur', label: 'Formateur', description: 'Peut gérer les cours et les émargements' },
  { value: 'Étudiant', label: 'Étudiant', description: 'Accès aux cours et émargements' },
  { value: 'Tuteur', label: 'Tuteur', description: 'Suivi des apprenants en entreprise' },
];

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  selectedUsers,
  onSave
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    setLoading(true);
    try {
      for (const user of selectedUsers) {
        await onSave(user.id, selectedRole);
      }
      toast.success(`Rôle mis à jour pour ${selectedUsers.length} utilisateur(s)`);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la modification du rôle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Modifier le rôle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            Modifier le rôle pour {selectedUsers.length} utilisateur(s) :
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1 bg-muted/50 rounded-lg p-3">
            {selectedUsers.map((user) => (
              <div key={user.id} className="text-sm flex items-center justify-between">
                <span>{user.first_name} {user.last_name}</span>
                <span className="text-muted-foreground text-xs">{user.role}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau rôle</label>
            <div className="grid gap-2">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === role.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={() => setSelectedRole(role.value)}
                    className="sr-only"
                  />
                  <div>
                    <div className="font-medium text-sm">{role.label}</div>
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedRole}>
            {loading ? 'Modification...' : 'Appliquer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeRoleModal;
