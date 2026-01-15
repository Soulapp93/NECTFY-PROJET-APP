import React, { useState } from 'react';
import { Clock, MapPin, User, Edit, Copy, Trash2, Calendar, Book, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScheduleSlot } from '@/services/scheduleService';

interface ScheduleListViewProps {
  slots: ScheduleSlot[];
  onEditSlot?: (slot: ScheduleSlot) => void;
  onDuplicateSlot?: (slot: ScheduleSlot) => void;
  onDeleteSlot?: (slot: ScheduleSlot) => void;
}

type SortField = 'date' | 'time' | 'module' | 'instructor';
type SortOrder = 'asc' | 'desc';

export const ScheduleListView: React.FC<ScheduleListViewProps> = ({
  slots,
  onEditSlot,
  onDuplicateSlot,
  onDeleteSlot
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterInstructor, setFilterInstructor] = useState<string>('all');

  // Filtrage et tri des créneaux
  const filteredAndSortedSlots = React.useMemo(() => {
    let filtered = slots.filter(slot => {
      const matchesSearch = 
        slot.formation_modules?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.users?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.users?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.room?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesInstructor = filterInstructor === 'all' || 
        (slot.users && `${slot.users.first_name} ${slot.users.last_name}` === filterInstructor);
      
      return matchesSearch && matchesInstructor;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'time':
          comparison = a.start_time.localeCompare(b.start_time);
          break;
        case 'module':
          comparison = (a.formation_modules?.title || '').localeCompare(b.formation_modules?.title || '');
          break;
        case 'instructor':
          const nameA = a.users ? `${a.users.first_name} ${a.users.last_name}` : '';
          const nameB = b.users ? `${b.users.first_name} ${b.users.last_name}` : '';
          comparison = nameA.localeCompare(nameB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [slots, searchTerm, sortField, sortOrder, filterInstructor]);

  // Liste unique des formateurs
  const instructors = React.useMemo(() => {
    const uniqueInstructors = Array.from(
      new Set(
        slots
          .filter(slot => slot.users)
          .map(slot => `${slot.users!.first_name} ${slot.users!.last_name}`)
      )
    );
    return uniqueInstructors.sort();
  }, [slots]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2 hover:bg-primary/10"
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <Card className="mb-8 border-0 shadow-xl overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center shadow-lg">
                <Book className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Liste des créneaux
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  {filteredAndSortedSlots.length} créneau{filteredAndSortedSlots.length > 1 ? 'x' : ''} affiché{filteredAndSortedSlots.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par module, formateur ou salle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
            <Select value={filterInstructor} onValueChange={setFilterInstructor}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filtrer par formateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les formateurs</SelectItem>
                {instructors.map(instructor => (
                  <SelectItem key={instructor} value={instructor}>
                    {instructor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* En-têtes de tri */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
            <div className="col-span-2">
              <SortButton field="date">Date</SortButton>
            </div>
            <div className="col-span-2">
              <SortButton field="time">Horaire</SortButton>
            </div>
            <div className="col-span-3">
              <SortButton field="module">Module</SortButton>
            </div>
            <div className="col-span-2">
              <SortButton field="instructor">Formateur</SortButton>
            </div>
            <div className="col-span-2">Salle</div>
            <div className="col-span-1">Actions</div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des créneaux */}
      <div className="space-y-3">
        {filteredAndSortedSlots.map((slot) => (
          <Card key={slot.id} className="shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{ 
                  backgroundColor: slot.color || '#3B82F6'
                }}>
            <CardContent className="p-6">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Date */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-white/80" />
                    <div>
                      <div className="font-medium text-white">
                        {format(parseISO(slot.date), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                      <div className="text-xs text-white/80">
                        {format(parseISO(slot.date), 'EEEE', { locale: fr })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horaire */}
                <div className="col-span-2">
                  <Badge variant="secondary" className="text-xs font-medium bg-white/20 text-white border-white/30">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </Badge>
                </div>

                {/* Module */}
                <div className="col-span-3">
                  <div className="font-medium text-white">
                    {slot.session_type === 'autonomie' ? 'AUTONOMIE' : (slot.formation_modules?.title || 'Module non défini')}
                  </div>
                  {slot.session_type === 'autonomie' ? (
                    <div className="text-xs text-white/85 mt-1">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </div>
                  ) : (
                    slot.notes && (
                      <div className="text-xs text-white/80 mt-1 truncate">
                        {slot.notes}
                      </div>
                    )
                  )}
                </div>

                {/* Formateur */}
                <div className="col-span-2">
                  {slot.session_type === 'autonomie' ? (
                    <span className="text-sm text-white/70"> </span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-white/80" />
                      <span className="text-sm text-white/90">
                        {slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Salle */}
                <div className="col-span-2">
                  {slot.session_type === 'autonomie' ? (
                    <span className="text-sm text-white/70"> </span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-white/80" />
                      <span className="text-sm text-white/90">{slot.room || 'Non définie'}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div className="flex space-x-1">
                    {onEditSlot && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditSlot(slot)}
                        className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDuplicateSlot && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDuplicateSlot(slot)}
                        className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeleteSlot && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteSlot(slot)}
                        className="h-8 w-8 p-0 text-white hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedSlots.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Aucun créneau trouvé
            </h3>
            <p className="text-muted-foreground">
              Aucun créneau ne correspond aux critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};