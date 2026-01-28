import React, { useState } from 'react';
import { Search, Clock, Calendar, BookOpen, CheckCircle2, XCircle, History, TrendingUp } from 'lucide-react';
import { useVirtualClasses } from '@/hooks/useVirtualClasses';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
                         instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.formation?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const completedCount = historyClasses.filter(c => c.status === 'Terminé').length;
  const cancelledCount = historyClasses.filter(c => c.status === 'Annulé').length;
  const completionRate = historyClasses.length > 0 
    ? Math.round((completedCount / historyClasses.length) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 w-44 rounded-xl" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-12 w-12 rounded-xl mb-3" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search and filters */}
      <Card className="border-0 shadow-sm bg-background/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher dans l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border/50 bg-background/80"
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl border-border/50 bg-background/80">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-gray-500/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg shadow-slate-500/30">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{historyClasses.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Total sessions</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{completedCount}</p>
              <p className="text-sm text-muted-foreground font-medium">Terminées</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
              <p className="text-sm text-muted-foreground font-medium">Taux de réussite</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredClasses.map((classItem) => {
          const isCompleted = classItem.status === 'Terminé';
          
          return (
            <Card 
              key={classItem.id} 
              className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Top gradient bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ 
                  background: isCompleted 
                    ? 'linear-gradient(to right, #10b981, #14b8a6)'
                    : 'linear-gradient(to right, #ef4444, #f97316)'
                }}
              />

              <CardContent className="p-5 pt-6">
                {/* Status badge */}
                <div className="mb-4">
                  <Badge className={`${
                    isCompleted 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  } border-0 px-3 py-1 text-xs font-medium`}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 mr-1.5" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1.5" />
                    )}
                    {classItem.status}
                  </Badge>
                </div>

                {/* Title and instructor */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1.5 line-clamp-2">
                    {classItem.title}
                  </h3>
                  {classItem.instructor && (
                    <p className="text-sm text-muted-foreground">
                      Par {classItem.instructor.first_name} {classItem.instructor.last_name}
                    </p>
                  )}
                </div>

                {/* Formation badge */}
                {classItem.formation && (
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-muted/50">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-sm" 
                      style={{ backgroundColor: classItem.formation.color }}
                    />
                    <span className="text-sm font-medium text-foreground truncate">{classItem.formation.title}</span>
                  </div>
                )}

                {/* Date info */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  {format(new Date(classItem.date), 'dd MMMM yyyy', { locale: fr })} • {classItem.start_time.substring(0, 5)} - {classItem.end_time.substring(0, 5)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredClasses.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun historique</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {historyClasses.length === 0 
                ? "Aucune classe virtuelle terminée pour le moment."
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