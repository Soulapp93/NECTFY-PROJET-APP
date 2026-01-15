import React from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Formation {
  id: number;
  name: string;
  level: string;
}

interface EmargementFiltersProps {
  formations: Formation[];
  selectedFormation: string;
  onFormationChange: (value: string) => void;
}

const EmargementFilters: React.FC<EmargementFiltersProps> = ({
  formations,
  selectedFormation,
  onFormationChange
}) => {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Formation</label>
          <Select value={selectedFormation || 'all'} onValueChange={(v) => onFormationChange(v === 'all' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les formations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
              {formations.map((formation) => (
                <SelectItem key={formation.id} value={String(formation.id)}>
                  {formation.name} ({formation.level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Date</label>
          <DatePicker placeholder="jj/mm/aaaa" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Statut</label>
          <Select value="all" onValueChange={() => undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="termine">Terminé</SelectItem>
              <SelectItem value="en-cours">En cours</SelectItem>
              <SelectItem value="programme">Programmé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default EmargementFilters;
