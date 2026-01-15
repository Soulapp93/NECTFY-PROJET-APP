import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { useFormations } from '@/hooks/useFormations';

interface DashboardFiltersProps {
  selectedFormationId?: string;
  onFormationChange: (formationId?: string) => void;
  selectedTimePeriod: string;
  onTimePeriodChange: (period: string) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  selectedFormationId,
  onFormationChange,
  selectedTimePeriod,
  onTimePeriodChange
}) => {
  const { formations, loading } = useFormations();

  const timePeriods = [
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' },
    { value: 'trimester', label: 'Trimestre' },
    { value: 'semester', label: 'Semestre' },
    { value: 'year', label: 'Année' },
  ];

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Formation :</label>
          <Select
            value={selectedFormationId || 'all'}
            onValueChange={(value) => onFormationChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une formation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les formations</SelectItem>
              {formations.map((formation) => (
                <SelectItem key={formation.id} value={formation.id}>
                  {formation.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Période :</label>
          <Select
            value={selectedTimePeriod}
            onValueChange={onTimePeriodChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              {timePeriods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

export default DashboardFilters;