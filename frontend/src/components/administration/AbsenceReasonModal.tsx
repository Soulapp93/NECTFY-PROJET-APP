import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AbsenceReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reasonType: string, reason: string) => Promise<void>;
  currentReason?: string;
  currentReasonType?: string;
  studentName: string;
}

const ABSENCE_REASONS = [
  { value: 'congé', label: 'Congé' },
  { value: 'arret_travail', label: 'Arrêt de travail' },
  { value: 'mission_professionnelle', label: 'Mission professionnelle' },
  { value: 'entreprise', label: 'En entreprise' },
  { value: 'injustifié', label: 'Injustifié' },
  { value: 'autre', label: 'Autre' }
];

const AbsenceReasonModal: React.FC<AbsenceReasonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentReason = '',
  currentReasonType = '',
  studentName
}) => {
  const [reasonType, setReasonType] = useState(currentReasonType);
  const [reason, setReason] = useState(currentReason);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!reasonType) {
      toast.error('Veuillez sélectionner un type de motif');
      return;
    }

    try {
      setSaving(true);
      await onSave(reasonType, reason);
      toast.success('Motif d\'absence mis à jour');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du motif');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Motif d'absence</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Étudiant : <span className="font-medium">{studentName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Type de motif *
            </label>
            <Select value={reasonType} onValueChange={setReasonType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
                {ABSENCE_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Commentaire additionnel
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Détails supplémentaires (optionnel)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbsenceReasonModal;