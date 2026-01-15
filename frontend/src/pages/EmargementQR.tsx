import React, { useState, useEffect } from 'react';
import { Calendar, Clock, QrCode, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import QRAttendanceCard from '../components/emargement/QRAttendanceCard';

const EmargementQR = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, userRole, loading: userLoading } = useCurrentUser();
  const navigate = useNavigate();

  const fetchAttendance = async () => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await attendanceService.getTodaysAttendanceForUser(userId, userRole);
      setAttendanceSheets(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && userId && userRole) {
      fetchAttendance();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [userId, userRole, userLoading]);

  const checkIfSigned = (sheet: AttendanceSheet): boolean => {
    return sheet.signatures?.some(sig => sig.user_id === userId) || false;
  };

  const isAttendanceOpen = (sheet: AttendanceSheet): boolean => {
    return sheet.is_open_for_signing || false;
  };

  const getActiveSessionsCount = () => {
    return attendanceSheets.filter(sheet => sheet.status === 'En cours').length;
  };

  const getSignedSessionsCount = () => {
    return attendanceSheets.filter(sheet => checkIfSigned(sheet)).length;
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header avec navigation */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/emargement')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'émargement classique
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <QrCode className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Émargement QR Code & Code</h1>
              <p className="text-blue-100">Système d'émargement moderne</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Sessions Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {getActiveSessionsCount()}
              </div>
              <div className="text-xs text-muted-foreground">
                Émargement possible maintenant
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Mes Émargements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getSignedSessionsCount()}
              </div>
              <div className="text-xs text-muted-foreground">
                Sessions émargées aujourd'hui
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {attendanceSheets.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Prévues aujourd'hui
              </div>
            </CardContent>
          </Card>
        </div>

        {/* En-tête des sessions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Sessions d'aujourd'hui
            </h2>
            <p className="text-muted-foreground mt-1">
              Utilisez le QR Code ou le code numérique pour vous émarger rapidement
            </p>
          </div>
        </div>

        {/* Liste des sessions avec cartes QR */}
        {attendanceSheets.length > 0 ? (
          <div className="grid gap-6">
            {attendanceSheets.map((sheet) => {
              const isSigned = checkIfSigned(sheet);
              const isOpen = isAttendanceOpen(sheet);

              return (
                <QRAttendanceCard
                  key={sheet.id}
                  attendanceSheet={sheet}
                  userRole={userRole}
                  isAlreadySigned={isSigned}
                  isAttendanceOpen={isOpen}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune session programmée
              </h3>
              <p className="text-muted-foreground">
                Les sessions d'émargement apparaîtront ici quand elles seront disponibles.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmargementQR;
