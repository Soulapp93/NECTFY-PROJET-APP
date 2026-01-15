
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video } from 'lucide-react';
import { useCreateVirtualClass, useInstructors, useFormationsForSelect } from '@/hooks/useVirtualClasses';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { moduleService } from '@/services/moduleService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (classData: any) => void;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { userId: currentUserId, userRole } = useCurrentUser();
  const { data: instructors = [] } = useInstructors();
  const { data: formations = [] } = useFormationsForSelect();
  const createClassMutation = useCreateVirtualClass();

  const [modules, setModules] = useState<any[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<any>(null);
  const [loadingModules, setLoadingModules] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor_id: userRole === 'Formateur' ? currentUserId : '',
    formation_id: '',
    module_id: '',
    date: '',
    start_time: '',
    end_time: '',
  });

  // Charger les modules quand une formation est sélectionnée
  useEffect(() => {
    const loadModules = async () => {
      if (formData.formation_id) {
        setLoadingModules(true);
        try {
          const formationData = formations.find(f => f.id === formData.formation_id);
          setSelectedFormation(formationData);
          
          const modulesList = await moduleService.getFormationModules(formData.formation_id);
          setModules(modulesList || []);
          
          // Auto-remplir le titre avec la formation
          if (formationData && !formData.title) {
            setFormData(prev => ({
              ...prev,
              title: `Classe virtuelle - ${formationData.title}`
            }));
          }
        } catch (error) {
          console.error('Erreur lors du chargement des modules:', error);
          setModules([]);
        }
        setLoadingModules(false);
      } else {
        setModules([]);
        setSelectedFormation(null);
      }
    };

    loadModules();
  }, [formData.formation_id]);

  // Auto-remplir l'instructeur quand un module est sélectionné
  useEffect(() => {
    if (formData.module_id && modules.length > 0) {
      const selectedModule = modules.find(m => m.id === formData.module_id);
      if (selectedModule?.module_instructors?.length > 0 && userRole !== 'Formateur') {
        const instructor = selectedModule.module_instructors[0].instructor;
        setFormData(prev => ({
          ...prev,
          instructor_id: instructor.id
        }));
      }
    }
  }, [formData.module_id, modules, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createClassMutation.mutateAsync(formData);
      onSubmit?.(formData);
      onClose();
      setFormData({
        title: '',
        description: '',
        instructor_id: userRole === 'Formateur' ? currentUserId : '',
        formation_id: '',
        module_id: '',
        date: '',
        start_time: '',
        end_time: '',
      });
      setModules([]);
      setSelectedFormation(null);
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle classe virtuelle</DialogTitle>
          <DialogDescription>Remplissez les informations pour planifier une classe virtuelle.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre du cours</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="formation">Formation</Label>
              <Select 
                value={formData.formation_id} 
                onValueChange={(value) => setFormData({ ...formData, formation_id: value, module_id: '', instructor_id: userRole === 'Formateur' ? currentUserId : '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une formation" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map((formation) => (
                    <SelectItem key={formation.id} value={formation.id}>
                      {formation.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.formation_id && (
              <div>
                <Label htmlFor="module">Module</Label>
                <Select 
                  value={formData.module_id} 
                  onValueChange={(value) => setFormData({ ...formData, module_id: value })}
                  disabled={loadingModules}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingModules ? "Chargement..." : "Sélectionner un module"} />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="instructor">Formateur</Label>
              <Select 
                value={formData.instructor_id} 
                onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
                disabled={userRole === 'Formateur'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un formateur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date
                </Label>
                <DatePicker
                  id="date"
                  value={formData.date}
                  onChange={(value) => setFormData({ ...formData, date: value })}
                  placeholder="Sélectionner"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Heure de début
                </Label>
                <TimePicker
                  id="start_time"
                  value={formData.start_time}
                  onChange={(value) => setFormData({ ...formData, start_time: value })}
                  placeholder="Début"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Heure de fin
                </Label>
                <TimePicker
                  id="end_time"
                  value={formData.end_time}
                  onChange={(value) => setFormData({ ...formData, end_time: value })}
                  placeholder="Fin"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createClassMutation.isPending}
            >
              {createClassMutation.isPending ? 'Création...' : 'Créer la classe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassModal;
