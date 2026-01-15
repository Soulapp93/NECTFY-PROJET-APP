import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  Download,
  Send,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AttendanceDashboardProps {
  userRole: 'Formateur' | 'Administrateur' | 'Étudiant';
}

const ModernAttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ userRole }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Données de démonstration
  const todayStats = {
    totalSessions: 8,
    activeSessions: 3,
    completedSessions: 4,
    pendingSessions: 1,
    totalStudents: 156,
    presentStudents: 142,
    absentStudents: 14,
    attendanceRate: 91
  };

  const recentSessions = [
    {
      id: '1',
      title: 'Formation React Avancé',
      time: '09:00 - 12:00',
      room: 'Salle A1',
      instructor: 'Sophie Dubois',
      students: { present: 18, total: 20 },
      status: 'En cours'
    },
    {
      id: '2',
      title: 'JavaScript ES6',
      time: '14:00 - 17:00',
      room: 'Salle B2',
      instructor: 'Pierre Martin',
      students: { present: 22, total: 25 },
      status: 'Terminé'
    },
    {
      id: '3',
      title: 'UX/UI Design',
      time: '10:00 - 13:00',
      room: 'Salle C3',
      instructor: 'Marie Leroy',
      students: { present: 15, total: 18 },
      status: 'À valider'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Terminé':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'À valider':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions rapides */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Tableau de Bord Émargement</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble des présences - {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
        
        {userRole !== 'Étudiant' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Send className="h-4 w-4 mr-2" />
              Rapport
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Config
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions Aujourd'hui</p>
                <p className="text-3xl font-bold">{todayStats.totalSessions}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% vs hier
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Présence</p>
                <p className="text-3xl font-bold">{todayStats.attendanceRate}%</p>
                <Progress value={todayStats.attendanceRate} className="mt-2" />
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions Actives</p>
                <p className="text-3xl font-bold text-blue-600">{todayStats.activeSessions}</p>
                <p className="text-sm text-muted-foreground">En cours maintenant</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">À Valider</p>
                <p className="text-3xl font-bold text-orange-600">{todayStats.pendingSessions}</p>
                <p className="text-sm text-muted-foreground">Actions requises</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des sessions récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sessions Récentes</span>
            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
                <TabsTrigger value="week">Cette semaine</TabsTrigger>
                <TabsTrigger value="month">Ce mois</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formation</TableHead>
                <TableHead>Horaires</TableHead>
                <TableHead>Salle</TableHead>
                {userRole !== 'Étudiant' && <TableHead>Formateur</TableHead>}
                <TableHead>Présences</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="font-medium">{session.title}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {session.time}
                    </div>
                  </TableCell>
                  <TableCell>{session.room}</TableCell>
                  {userRole !== 'Étudiant' && (
                    <TableCell>{session.instructor}</TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          {session.students.present}/{session.students.total}
                        </span>
                      </div>
                      <Progress 
                        value={(session.students.present / session.students.total) * 100} 
                        className="w-16"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {session.status === 'En cours' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Signer
                        </Button>
                      )}
                      {session.status === 'À valider' && userRole !== 'Étudiant' && (
                        <Button size="sm" variant="outline">
                          Valider
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Voir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions rapides contextuelles selon le rôle */}
      {userRole !== 'Étudiant' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="flex items-center justify-center p-6 h-auto flex-col space-y-2">
                <Calendar className="h-8 w-8" />
                <span>Créer Session</span>
              </Button>
              <Button variant="outline" className="flex items-center justify-center p-6 h-auto flex-col space-y-2">
                <Download className="h-8 w-8" />
                <span>Export Masse</span>
              </Button>
              <Button variant="outline" className="flex items-center justify-center p-6 h-auto flex-col space-y-2">
                <Settings className="h-8 w-8" />
                <span>Paramètres</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModernAttendanceDashboard;