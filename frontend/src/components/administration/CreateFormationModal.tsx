
import React, { useState } from 'react';
import { X, GraduationCap, Calendar, Plus, BookOpen } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModuleForm, { ModuleFormData } from './ModuleForm';
import ColorPalette from './ColorPalette';
import { formationService } from '@/services/formationService';
import { moduleService } from '@/services/moduleService';
import { establishmentService } from '@/services/establishmentService';

interface CreateFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormationFormData {
  title: string;
  description: string;
  level: string;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  duration: number;
}

const CreateFormationModal: React.FC<CreateFormationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<FormationFormData>({
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    setError(null);

    try {
      setLoading(true);

      if (!formData.title.trim()) {
        setError('Le titre de la formation est requis');
        return;
      }

      console.log('Récupération de l\'établissement...');
      const establishment = await establishmentService.getOrCreateDefaultEstablishment();
      console.log('Établissement récupéré:', establishment);

      const today = new Date();
      const defaultStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const defaultEndDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

      const formationData = {
        ...formData,
        start_date: formData.start_date || defaultStartDate.toISOString().split('T')[0],
        end_date: formData.end_date || defaultEndDate.toISOString().split('T')[0],
        duration: formData.duration || 0,
        max_students: 25,
        price: 0,
        establishment_id: establishment.id
      };

      console.log('Données de formation à envoyer:', formationData);

      const formation = await formationService.createFormation(formationData);
      console.log('Formation créée avec succès:', formation);

      // Créer les modules
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        if (module.title.trim()) {
          await moduleService.createModule({
            formation_id: formation.id,
            title: module.title,
            description: module.description,
            duration_hours: module.duration_hours || 0,
            order_index: i
          }, module.instructorIds);
        }
      }

      console.log('Formation et modules créés avec succès');
      onSuccess();
      onClose();
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        description: '',
        level: 'BAC+1',
        start_date: '',
        end_date: '',
        status: 'Actif',
        color: '#8B5CF6',
        duration: 0
      });
      setModules([]);
      
    } catch (error) {
      console.error('Erreur lors de la création de la formation:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la création de la formation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-primary/20">
        <div className="flex items-center justify-between p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            Nouvelle formation
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-primary/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-muted/30 rounded-xl p-5 border-2 border-primary/10">
            <h3 className="text-lg font-semibold text-foreground mb-4">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Titre de la formation *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Niveau</label>
                <Select value={formData.level} onValueChange={(v) => setFormData((p) => ({ ...p, level: v }))}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Statut</label>
                <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                    <SelectItem value="Brouillon">Brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date de début (optionnel)
                </label>
                <DatePicker
                  name="start_date"
                  value={formData.start_date}
                  onChange={(v) => setFormData((p) => ({ ...p, start_date: v }))}
                  placeholder="jj/mm/aaaa"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Si vide, la date d'aujourd'hui sera utilisée</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date de fin (optionnel)
                </label>
                <DatePicker
                  name="end_date"
                  value={formData.end_date}
                  onChange={(v) => setFormData((p) => ({ ...p, end_date: v }))}
                  placeholder="jj/mm/aaaa"
                />
                <p className="text-xs text-muted-foreground mt-1.5">Si vide, une date dans un an sera utilisée</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Durée de la formation (nombre d'heures)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 border-2 border-primary/30 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-all"
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
              <h3 className="text-lg font-semibold text-foreground">
                Modules de formation ({modules.length})
              </h3>
              <button
                type="button"
                onClick={addModule}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter un module
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5">
                <BookOpen className="h-10 w-10 text-primary/50 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Aucun module ajouté</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Les modules peuvent être ajoutés maintenant ou plus tard</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <ModuleForm
                    key={index}
                    moduleIndex={index}
                    onAdd={(moduleData) => updateModule(index, moduleData)}
                    onRemove={() => removeModule(index)}
                  />
                ))}
              </div>
            )}  
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-foreground border-2 border-primary/30 rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-colors font-medium"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md transition-all"
            >
              {loading ? 'Création...' : 'Créer la formation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFormationModal;
