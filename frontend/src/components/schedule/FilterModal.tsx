import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface FilterModalProps {
  onApplyFilters: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  instructors: string[];
  rooms: string[];
  formations: string[];
  timeSlots: string[];
}

export const FilterModal: React.FC<FilterModalProps> = ({ onApplyFilters }) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    instructors: [],
    rooms: [],
    formations: [],
    timeSlots: []
  });

  const instructors = ['M. Dubois', 'Mme Martin', 'M. Durand', 'Mme Bernard', 'M. Petit', 'Mme Leroy'];
  const rooms = ['Salle A101', 'Salle B202', 'Salle C301', 'Salle D401', 'Atelier 1', 'Amphithéâtre'];
  const formations = ['Formation Marketing', 'Formation Technique', 'Formation Créative', 'Formation Expert'];
  const timeSlots = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'];

  const handleFilterChange = (category: keyof FilterOptions, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [category]: checked 
        ? [...prev[category], value]
        : prev[category].filter(item => item !== value)
    }));
  };

  const clearFilters = () => {
    setFilters({
      instructors: [],
      rooms: [],
      formations: [],
      timeSlots: []
    });
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    setOpen(false);
  };

  const activeFiltersCount = Object.values(filters).flat().length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtrer
          {activeFiltersCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filtres avancés</span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Effacer tout
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Formateurs */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Formateurs</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {instructors.map((instructor) => (
                <div key={instructor} className="flex items-center space-x-2">
                  <Checkbox
                    id={`instructor-${instructor}`}
                    checked={filters.instructors.includes(instructor)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('instructors', instructor, checked as boolean)
                    }
                  />
                  <Label htmlFor={`instructor-${instructor}`} className="text-sm">
                    {instructor}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Salles */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Salles</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rooms.map((room) => (
                <div key={room} className="flex items-center space-x-2">
                  <Checkbox
                    id={`room-${room}`}
                    checked={filters.rooms.includes(room)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('rooms', room, checked as boolean)
                    }
                  />
                  <Label htmlFor={`room-${room}`} className="text-sm">
                    {room}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Formations */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Formations</Label>
            <div className="space-y-2">
              {formations.map((formation) => (
                <div key={formation} className="flex items-center space-x-2">
                  <Checkbox
                    id={`formation-${formation}`}
                    checked={filters.formations.includes(formation)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('formations', formation, checked as boolean)
                    }
                  />
                  <Label htmlFor={`formation-${formation}`} className="text-sm">
                    {formation}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Créneaux horaires */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Créneaux horaires</Label>
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div key={slot} className="flex items-center space-x-2">
                  <Checkbox
                    id={`slot-${slot}`}
                    checked={filters.timeSlots.includes(slot)}
                    onCheckedChange={(checked) => 
                      handleFilterChange('timeSlots', slot, checked as boolean)
                    }
                  />
                  <Label htmlFor={`slot-${slot}`} className="text-sm">
                    {slot}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
            Appliquer les filtres
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};