import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EnhancedAttendanceSheetModal from '../administration/EnhancedAttendanceSheetModal';

interface AttendanceHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ isOpen, onClose }) => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const { userId, userRole } = useCurrentUser();

  const fetchAttendanceHistory = async () => {
    if (!userId || !userRole) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const realHistory = await attendanceService.getAttendanceHistoryForUser(userId, userRole);
      setAttendanceSheets(realHistory);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
      setAttendanceSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceHistory();
    }
  }, [isOpen, userId, userRole]);

  const checkIfSigned = (sheet: AttendanceSheet) => {
    return sheet.signatures?.some(sig => sig.user_id === userId) || false;
  };

  const getStatusColor = (status: string, isSigned: boolean) => {
    if (isSigned) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    switch (status) {
      case 'Validé':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'En cours':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Terminé':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Fermé':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (isSigned: boolean) => {
    return isSigned ? 
      <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const handleViewSheet = (sheet: AttendanceSheet) => {
    setSelectedSheet(sheet);
    setShowAttendanceSheet(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Historique des Émargements</h2>
              <Button variant="ghost" onClick={onClose} className="text-white hover:bg-purple-700">
                ✕
              </Button>
            </div>
            <p className="text-purple-100 mt-2">Consultez vos présences passées</p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : attendanceSheets.length > 0 ? (
              <div className="space-y-4">
                {attendanceSheets.map((sheet) => {
                  const isSigned = checkIfSigned(sheet);
                  
                  return (
                    <Card key={sheet.id} className="hover:shadow-lg transition-all border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {sheet.formations?.title}
                              </h3>
                              <Badge 
                                className={`border ${getStatusColor(sheet.status, isSigned)}`}
                                variant="outline"
                              >
                                {getStatusIcon(isSigned)}
                                <span className="ml-1">{isSigned ? 'Présent.e' : 'Absent.e'}</span>
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                                Terminé
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {format(new Date(sheet.date), 'EEEE d MMM yyyy', { locale: fr })}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {sheet.start_time.substring(0, 5)} - {sheet.end_time.substring(0, 5)}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {sheet.instructor?.first_name} {sheet.instructor?.last_name}
                              </div>
                              {sheet.room && (
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" />
                                  {sheet.room}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Seule l'administration peut voir les feuilles d'émargement */}
                          {userRole === 'Admin' && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleViewSheet(sheet)}
                              className="ml-4"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Voir la feuille
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun historique disponible
                    </h3>
                    <p className="text-gray-600">
                      Vous n'avez pas encore d'émargements dans l'historique.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal feuille d'émargement */}
      {selectedSheet && showAttendanceSheet && (
        <EnhancedAttendanceSheetModal
          isOpen={showAttendanceSheet}
          onClose={() => {
            setShowAttendanceSheet(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          onUpdate={fetchAttendanceHistory}
          onValidateSheet={async () => {
            await fetchAttendanceHistory();
            setShowAttendanceSheet(false);
            setSelectedSheet(null);
          }}
        />
      )}
    </>
  );
};

export default AttendanceHistory;
