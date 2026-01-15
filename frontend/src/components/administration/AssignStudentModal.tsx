import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2 } from 'lucide-react';
import { Tutor } from '@/services/tutorService';
import { useTutors } from '@/hooks/useTutors';
import { useUsers } from '@/hooks/useUsers';

interface AssignStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor | null;
}

export const AssignStudentModal: React.FC<AssignStudentModalProps> = ({
  isOpen,
  onClose,
  tutor
}) => {
  const { assignStudentToTutor } = useTutors();
  const { users } = useUsers();
  
  const [formData, setFormData] = useState({
    student_id: '',
    contract_type: '' as 'Apprentissage' | 'Professionnalisation' | '',
    contract_start_date: '',
    contract_end_date: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtrer pour ne garder que les étudiants
  const students = users.filter(user => user.role === 'Étudiant');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        student_id: '',
        contract_type: '',
        contract_start_date: '',
        contract_end_date: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.student_id) {
      newErrors.student_id = 'Veuillez sélectionner un étudiant';
    }

    if (!formData.contract_type) {
      newErrors.contract_type = 'Veuillez sélectionner un type de contrat';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !tutor) return;

    try {
      setLoading(true);
      await assignStudentToTutor({
        tutor_id: tutor.id,
        student_id: formData.student_id,
        contract_type: formData.contract_type || undefined,
        contract_start_date: formData.contract_start_date || undefined,
        contract_end_date: formData.contract_end_date || undefined
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assigner un étudiant à {tutor?.first_name} {tutor?.last_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student_id">Étudiant *</Label>
            <Select
              value={formData.student_id}
              onValueChange={(value) => handleChange('student_id', value)}
            >
              <SelectTrigger className={errors.student_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Sélectionner un étudiant" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} - {student.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.student_id && (
              <p className="text-sm text-destructive">{errors.student_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_type">Type de contrat *</Label>
            <Select
              value={formData.contract_type}
              onValueChange={(value) => handleChange('contract_type', value)}
            >
              <SelectTrigger className={errors.contract_type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Sélectionner un type de contrat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apprentissage">Contrat d'Apprentissage</SelectItem>
                <SelectItem value="Professionnalisation">Contrat de Professionnalisation</SelectItem>
              </SelectContent>
            </Select>
            {errors.contract_type && (
              <p className="text-sm text-destructive">{errors.contract_type}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_start_date">Date de début</Label>
              <DatePicker
                id="contract_start_date"
                value={formData.contract_start_date}
                onChange={(value) => handleChange('contract_start_date', value)}
                placeholder="Sélectionner une date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_end_date">Date de fin</Label>
              <DatePicker
                id="contract_end_date"
                value={formData.contract_end_date}
                onChange={(value) => handleChange('contract_end_date', value)}
                placeholder="Sélectionner une date"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assigner
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};