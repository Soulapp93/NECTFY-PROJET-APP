import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Filter, Search, ClipboardCheck, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCurrentUser, useUserWithRelations } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { attendanceService } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  room?: string;
  formation_title: string;
  status: 'Présent' | 'Absent' | 'Non signé';
  signed_at?: string;
  absence_reason?: string;
  instructor_name?: string;
}

const SuiviEmargement = () => {
  const { userRole, userId } = useCurrentUser();
  const { relationInfo } = useUserWithRelations();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [studentInfo, setStudentInfo] = useState<{ name: string; email: string } | null>(null);
  const [noStudentAssigned, setNoStudentAssigned] = useState(false);

  useEffect(() => {
    if (userId && userRole) {
      loadAttendanceHistory();
    }
  }, [userId, userRole, relationInfo]);

  const loadAttendanceHistory = async () => {
    try {
      setLoading(true);
      
      let records: AttendanceRecord[] = [];
      
      // Déterminer l'ID de l'utilisateur cible (pour tuteur, c'est l'apprenti)
      let targetUserId = userId;
      let targetUserRole = userRole;
      
      if (userRole === 'Tuteur') {
        // Pour les tuteurs, on récupère les données de l'apprenti
        console.log('[SuiviEmargement] Tuteur détecté, recherche de l\'apprenti...');
        const { data: studentAssignment, error: studentError } = await supabase
          .from('tutor_student_assignments')
          .select(`
            student_id,
            users:student_id (
              first_name,
              last_name,
              email
            )
          `)
          .eq('tutor_id', userId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (studentError) {
          console.error('[SuiviEmargement] Erreur lors de la recherche de l\'apprenti:', studentError);
        }
        
        if (studentAssignment && studentAssignment.student_id) {
          const student = studentAssignment.users as any;
          console.log('[SuiviEmargement] Apprenti trouvé:', studentAssignment.student_id, student);
          targetUserId = studentAssignment.student_id;
          targetUserRole = 'Étudiant';
          setStudentInfo({
            name: `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
            email: student?.email || ''
          });
          setNoStudentAssigned(false);
        } else {
          console.log('[SuiviEmargement] Aucun apprenti assigné à ce tuteur');
          setNoStudentAssigned(true);
          setStudentInfo(null);
          setLoading(false);
          return;
        }
      }
      
      // Récupérer l'historique réel depuis la base de données
      if (targetUserRole === 'Formateur') {
        // Pour les formateurs, récupérer toutes les sessions qu'ils ont dispensées
        const { data: sheets, error } = await supabase
          .from('attendance_sheets')
          .select(`
            id,
            date,
            start_time,
            end_time,
            title,
            room,
            status,
            formations(title, level),
            attendance_signatures(
              id,
              user_id,
              user_type,
              signed_at,
              present,
              absence_reason
            )
          `)
          .eq('instructor_id', targetUserId)
          .order('date', { ascending: false })
          .order('start_time', { ascending: false });
        
        if (!error && sheets) {
          records = sheets.map(sheet => {
            const instructorSignature = sheet.attendance_signatures?.find(
              sig => sig.user_type === 'instructor' && sig.user_id === targetUserId
            );
            
            return {
              id: sheet.id,
              date: sheet.date,
              start_time: sheet.start_time,
              end_time: sheet.end_time,
              title: sheet.title,
              room: sheet.room || undefined,
              formation_title: (sheet.formations as any)?.title || 'N/A',
              status: instructorSignature?.present ? 'Présent' : (instructorSignature ? 'Absent' : 'Non signé') as any,
              signed_at: instructorSignature?.signed_at,
              instructor_name: 'Vous'
            };
          });
        }
      } else {
        // Pour les étudiants (et tuteurs voyant leur apprenti)
        // D'abord récupérer les formations de l'utilisateur
        const { data: userFormations } = await supabase
          .from('user_formation_assignments')
          .select('formation_id')
          .eq('user_id', targetUserId);
        
        if (userFormations && userFormations.length > 0) {
          const formationIds = userFormations.map(uf => uf.formation_id);
          
          const { data: sheets, error } = await supabase
            .from('attendance_sheets')
            .select(`
              id,
              date,
              start_time,
              end_time,
              title,
              room,
              status,
              instructor_id,
              formations(title, level),
              users:instructor_id(first_name, last_name),
              attendance_signatures(
                id,
                user_id,
                user_type,
                signed_at,
                present,
                absence_reason
              )
            `)
            .in('formation_id', formationIds)
            .order('date', { ascending: false })
            .order('start_time', { ascending: false });
          
          if (!error && sheets) {
            records = sheets.map(sheet => {
              const userSignature = sheet.attendance_signatures?.find(
                sig => sig.user_type === 'student' && sig.user_id === targetUserId
              );
              
              const instructor = sheet.users as any;
              
              return {
                id: sheet.id,
                date: sheet.date,
                start_time: sheet.start_time,
                end_time: sheet.end_time,
                title: sheet.title,
                room: sheet.room || undefined,
                formation_title: (sheet.formations as any)?.title || 'N/A',
                status: userSignature?.present ? 'Présent' : (userSignature ? 'Absent' : 'Non signé') as any,
                signed_at: userSignature?.signed_at,
                absence_reason: userSignature?.absence_reason || undefined,
                instructor_name: instructor ? `${instructor.first_name} ${instructor.last_name}` : 'N/A'
              };
            });
          }
        }
      }
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.formation_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.instructor_name && record.instructor_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || statusFilter === '' || record.status === statusFilter;
    const matchesDate = dateFilter === '' || record.date.includes(dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const variants = {
      'Présent': 'bg-green-100 text-green-800 border-green-200',
      'Absent': 'bg-red-100 text-red-800 border-red-200',
      'Non signé': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    const icons = {
      'Présent': CheckCircle,
      'Absent': XCircle,
      'Non signé': AlertCircle
    };

    const Icon = icons[status];

    return (
      <Badge variant="secondary" className={`${variants[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getStatsCards = () => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'Présent').length;
    const absent = filteredRecords.filter(r => r.status === 'Absent').length;
    const unsigned = filteredRecords.filter(r => r.status === 'Non signé').length;
    
    const attendanceRate = total > 0 ? (present / total * 100).toFixed(1) : '0';

    return [
      {
        title: 'Taux de présence',
        value: `${attendanceRate}%`,
        description: 'Présences sur total des cours',
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        title: 'Présences',
        value: present.toString(),
        description: 'Cours suivis avec succès',
        icon: CheckCircle,
        color: 'text-green-600'
      },
      {
        title: 'Absences',
        value: absent.toString(),
        description: 'Cours manqués',
        icon: XCircle,
        color: 'text-red-600'
      }
    ];
  };

  const getPageTitle = () => {
    if (userRole === 'Tuteur') {
      if (studentInfo) {
        return `Suivi Émargement - ${studentInfo.name}`;
      }
      return 'Suivi Émargement Apprenti';
    }
    return 'Suivi Émargement';
  };

  const getPageDescription = () => {
    if (userRole === 'Tuteur') {
      if (studentInfo) {
        return `Historique des émargements de votre apprenti ${studentInfo.name}`;
      }
      return 'Aucun apprenti assigné à votre compte';
    } else if (userRole === 'Étudiant') {
      return 'Votre historique de présences et absences aux cours';
    } else if (userRole === 'Formateur') {
      return 'Historique de vos interventions et cours dispensés';
    }
    return 'Historique général des émargements';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-64"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-96"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Affichage spécial pour les tuteurs sans apprenti assigné
  if (userRole === 'Tuteur' && noStudentAssigned) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Suivi Émargement Apprenti</h1>
          <p className="text-gray-600">Suivez les émargements de votre apprenti</p>
        </div>
        
        <Card className="max-w-lg mx-auto mt-12">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle>Aucun apprenti assigné</CardTitle>
            <CardDescription className="text-base">
              Vous n'avez actuellement aucun apprenti assigné à votre compte tuteur. 
              Contactez l'administrateur de l'établissement pour être associé à un apprenti.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* En-tête */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          {getPageTitle()}
        </h1>
        <p className="text-muted-foreground">{getPageDescription()}</p>
        {userRole === 'Tuteur' && studentInfo && (
          <div className="mt-2 text-sm text-muted-foreground">
            Apprenti: <span className="font-medium text-primary">{studentInfo.name}</span> ({studentInfo.email})
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {getStatsCards().map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-primary/5 to-transparent">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtres */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent py-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par cours, formation ou formateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Présent">Présent</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Non signé">Non signé</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full lg:w-56 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(new Date(dateFilter + '-01'), 'MMMM yyyy', { locale: fr }) : <span className="text-muted-foreground">Sélectionner un mois</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 bg-card border border-border shadow-lg z-50" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentYear = dateFilter ? parseInt(dateFilter.split('-')[0]) : new Date().getFullYear();
                        setDateFilter(`${currentYear - 1}-01`);
                      }}
                    >
                      ←
                    </Button>
                    <span className="font-semibold text-foreground">
                      {dateFilter ? dateFilter.split('-')[0] : new Date().getFullYear()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const currentYear = dateFilter ? parseInt(dateFilter.split('-')[0]) : new Date().getFullYear();
                        setDateFilter(`${currentYear + 1}-01`);
                      }}
                    >
                      →
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month) => {
                      const year = dateFilter ? dateFilter.split('-')[0] : new Date().getFullYear().toString();
                      const monthValue = `${year}-${month}`;
                      const isSelected = dateFilter === monthValue;
                      const monthName = format(new Date(`${year}-${month}-01`), 'MMM', { locale: fr });
                      
                      return (
                        <Button
                          key={month}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`capitalize ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'}`}
                          onClick={() => setDateFilter(monthValue)}
                        >
                          {monthName}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground"
                    onClick={() => setDateFilter('')}
                  >
                    Effacer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
              }}
              className="rounded-xl border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des émargements */}
      <Card>
        <CardHeader className="border-b border-border/30">
          <CardTitle className="text-lg">Historique des émargements</CardTitle>
          <CardDescription>
            {filteredRecords.length} enregistrement{filteredRecords.length > 1 ? 's' : ''} trouvé{filteredRecords.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Cours</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Horaires</TableHead>
                  <TableHead>Salle</TableHead>
                  <TableHead>Formateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Observations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary/60" />
                        <span className="font-medium">{new Date(record.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">{record.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                        {record.formation_title}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{record.start_time.substring(0, 5)} - {record.end_time.substring(0, 5)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{record.room || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{record.instructor_name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell>
                      {record.absence_reason && (
                        <span className="text-sm text-muted-foreground">
                          {record.absence_reason}
                        </span>
                      )}
                      {record.signed_at && record.status === 'Présent' && (
                        <span className="text-xs text-green-600 font-medium">
                          Signé le {new Date(record.signed_at).toLocaleString('fr-FR')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Aucun enregistrement trouvé</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuiviEmargement;