
import React, { useState } from 'react';
import { X, Plus, User } from 'lucide-react';
import { useInstructors } from '@/hooks/useInstructors';

export interface ModuleFormData {
  title: string;
  description: string;
  instructorIds: string[];
  duration_hours: number;
}

interface ModuleFormProps {
  onAdd: (module: ModuleFormData) => void;
  onRemove: () => void;
  moduleIndex: number;
  initialData?: ModuleFormData;
}

const ModuleForm: React.FC<ModuleFormProps> = ({ onAdd, onRemove, moduleIndex, initialData }) => {
  const { instructors } = useInstructors();
  const [formData, setFormData] = useState<ModuleFormData>(
    initialData || {
      title: '',
      description: '',
      instructorIds: [],
      duration_hours: 0
    }
  );

  // Mettre à jour le formData si initialData change (pour l'édition)
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = {
      ...formData,
      [name]: value
    };
    setFormData(newData);
    onAdd(newData);
  };

  const handleInstructorToggle = (instructorId: string) => {
    const newInstructorIds = formData.instructorIds.includes(instructorId)
      ? formData.instructorIds.filter(id => id !== instructorId)
      : [...formData.instructorIds, instructorId];
    
    const newData = { ...formData, instructorIds: newInstructorIds };
    setFormData(newData);
    onAdd(newData);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-medium text-gray-700">Module {moduleIndex + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre du module *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durée du module (nombre d'heures)
          </label>
          <input
            type="number"
            name="duration_hours"
            value={formData.duration_hours}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Formateurs (optionnel)
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
            {instructors.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun formateur disponible - Les formateurs peuvent être assignés plus tard</p>
            ) : (
              instructors.map(instructor => (
                <label key={instructor.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={formData.instructorIds.includes(instructor.id)}
                    onChange={() => handleInstructorToggle(instructor.id)}
                    className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">
                    {instructor.first_name} {instructor.last_name}
                  </span>
                </label>
              ))
            )}
          </div>
          {formData.instructorIds.length === 0 && instructors.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Aucun formateur sélectionné - peut être assigné plus tard</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleForm;
