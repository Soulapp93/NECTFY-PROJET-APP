import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Save, Plus, BookOpen } from 'lucide-react';
import ColorPalette from './ColorPalette';
import ModuleForm, { ModuleFormData } from './ModuleForm';
import { formationService, Formation } from '@/services/formationService';
import { moduleService } from '@/services/moduleService';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface EditFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  formationId: string | null;
}

interface EditFormationData {
  title: string;
  description: string;
  level: string;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  duration: number;
}

const EditFormationModal: React.FC<EditFormationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  formationId
}) => {
  const [formData, setFormData] = useState<EditFormationData>({
    title: '',
    description: '',
    level: 'BAC+1',
    start_date: '',
    end_date: '',
    status: 'Actif',
    color: '#8B5CF6',
    duration: 0
  });

  const [modules, setModules] = useState<ModuleFormData[]>([]);
  const [existingModules, setExistingModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    if (isOpen && formationId) {
      loadFormation();
    }
  }, [isOpen, formationId]);

  const loadFormation = async () => {
    if (!formationId) return;
    
    try {
      setInitialLoading(true);
      setError(null);
      const formation = await formationService.getFormationById(formationId);
      
      setFormData({
        title: formation.title,
        description: formation.description || '',
        level: formation.level,
        start_date: formation.start_date,
        end_date: formation.end_date,
        status: formation.status,
        color: formation.color || '#8B5CF6',
        duration: formation.duration
      });

      // Charger les modules existants
      const formationModules = await moduleService.getFormationModules(formationId);
      setExistingModules(formationModules || []);
      
      // Convertir en format ModuleFormData pour l'édition
      const modulesData = formationModules.map((mod: any) => ({
        title: mod.title,
        description: mod.description || '',
        instructorIds: mod.module_instructors?.map((mi: any) => mi.instructor_id) || [],
        duration_hours: mod.duration_hours || 0
      }));
      setModules(modulesData);
    } catch (error) {
      console.error('Erreur lors du chargement de la formation:', error);
      setError('Erreur lors du chargement de la formation');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? Number(value) : value
    }));
    if (error) setError(null);
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
    if (error) setError(null);
  };

  const addModule = () => {
    setModules(prev => [...prev, {
      title: '',
      description: '',
      instructorIds: [],
      duration_hours: 0
    }]);
  };

  const updateModule = (index: number, moduleData: ModuleFormData) => {
    setModules(prev => prev.map((module, i) => i === index ? moduleData : module));
  };

  const removeModule = (index: number) => {
    setModules(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationId) return;
    
    setError(null);

    try {
      setLoading(true);

      if (!formData.title.trim()) {
        setError('Le titre de la formation est requis');
        return;
      }

      await formationService.updateFormation(formationId, formData);

      // Supprimer les modules existants qui ne sont plus dans la liste
      for (const existingModule of existingModules) {
        const stillExists = modules.some((_, idx) => existingModules[idx]?.id === existingModule.id);
        if (!stillExists) {
          await moduleService.deleteModule(existingModule.id);
        }
      }

      // Créer ou mettre à jour les modules
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        if (module.title.trim()) {
          const existingModule = existingModules[i];
          
          if (existingModule) {
            // Mettre à jour le module existant
            await moduleService.updateModule(existingModule.id, {
              title: module.title,
              description: module.description,
              order_index: i,
              duration_hours: module.duration_hours || 0
            }, module.instructorIds);
          } else {
            // Créer un nouveau module
            await moduleService.createModule({
              formation_id: formationId,
              title: module.title,
              description: module.description,
              duration_hours: module.duration_hours || 0,
              order_index: i
            }, module.instructorIds);
          }
        }
      }

      toast.success('Formation et modules mis à jour avec succès');
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la modification de la formation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la modification de la formation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            <GraduationCap className="h-5 w-5 inline mr-2" />
            Modifier la formation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {initialLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Chargement...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Titre de la formation *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Niveau</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAC+1">BAC+1</SelectItem>
                      <SelectItem value="BAC+2">BAC+2</SelectItem>
                      <SelectItem value="BAC+3">BAC+3</SelectItem>
                      <SelectItem value="BAC+4">BAC+4</SelectItem>
                      <SelectItem value="BAC+5">BAC+5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                      <SelectItem value="Brouillon">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <DatePicker
                    value={formData.start_date}
                    onChange={(value) => setFormData(prev => ({ ...prev, start_date: value }))}
                    placeholder="Sélectionner une date"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <DatePicker
                    value={formData.end_date}
                    onChange={(value) => setFormData(prev => ({ ...prev, end_date: value }))}
                    placeholder="Sélectionner une date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (heures)</Label>
                  <Input
                    id="duration"
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <ColorPalette 
                    selectedColor={formData.color}
                    onColorChange={handleColorChange}
                  />
                </div>
              </div>
            </div>

            {/* Modules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Modules de formation ({modules.length})
                </h3>
                <button
                  type="button"
                  onClick={addModule}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un module
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun module ajouté</p>
                  <p className="text-sm text-gray-400">Les modules peuvent être ajoutés maintenant ou plus tard</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <ModuleForm
                      key={index}
                      moduleIndex={index}
                      initialData={module}
                      onAdd={(moduleData) => updateModule(index, moduleData)}
                      onRemove={() => removeModule(index)}
                    />
                  ))}
                </div>
              )}  
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Modification...' : 'Modifier la formation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditFormationModal;
