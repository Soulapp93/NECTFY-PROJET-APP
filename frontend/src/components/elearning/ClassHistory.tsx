import React, { useState } from 'react';
import { Search, Clock, Calendar, User, BookOpen } from 'lucide-react';
import { useVirtualClasses } from '@/hooks/useVirtualClasses';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { VirtualClass } from '@/services/virtualClassService';

const ClassHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const { data: virtualClasses = [], isLoading } = useVirtualClasses();

  // Filter only terminated and cancelled classes for history
  const historyClasses = virtualClasses.filter(cls => 
    cls.status === 'Terminé' || cls.status === 'Annulé'
  );

  const filteredClasses = historyClasses.filter(cls => {
    const instructorName = cls.instructor 
      ? `${cls.instructor.first_name} ${cls.instructor.last_name}` 
      : '';
    const matchesSearch = cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instructorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedMonth === 'all') return matchesSearch;
    
    const classDate = new Date(cls.date);
    const classMonth = format(classDate, 'yyyy-MM');
    return matchesSearch && classMonth === selectedMonth;
  });

  // Get unique months for filter
  const availableMonths = Array.from(
    new Set(
      historyClasses.map(cls => format(new Date(cls.date), 'yyyy-MM'))
    )
  ).sort().reverse();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Terminé':
        return 'bg-success text-success-foreground';
      case 'Annulé':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher dans l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(`${month}-01`), 'MMMM yyyy', { locale: fr })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total classes</p>
                <p className="text-2xl font-semibold">{historyClasses.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Terminées</p>
                <p className="text-2xl font-semibold text-success">
                  {historyClasses.filter(c => c.status === 'Terminé').length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Annulées</p>
                <p className="text-2xl font-semibold text-destructive">
                  {historyClasses.filter(c => c.status === 'Annulé').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {classItem.title}
                  </h3>
                  {classItem.instructor && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Par {classItem.instructor.first_name} {classItem.instructor.last_name}
                    </p>
                  )}
                  <Badge className={getStatusColor(classItem.status)}>
                    {classItem.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {classItem.description && (
                <p className="text-sm text-muted-foreground">
                  {classItem.description}
                </p>
              )}

              {classItem.formation && (
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: classItem.formation.color }}
                  />
                  <span className="text-sm font-medium">{classItem.formation.title}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {format(new Date(classItem.date), 'dd MMMM yyyy', { locale: fr })} • {classItem.start_time.substring(0, 5)} - {classItem.end_time.substring(0, 5)}
                </div>
                
                {classItem.recording_url && (
                  <div className="flex items-center text-sm text-primary">
                    <Clock className="h-4 w-4 mr-2" />
                    Enregistrement disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun historique trouvé</h3>
            <p className="text-muted-foreground">
              {historyClasses.length === 0 
                ? "Aucune classe terminée pour le moment."
                : "Aucune classe ne correspond à vos critères de recherche."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassHistory;