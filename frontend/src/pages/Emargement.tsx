import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle2, FileText, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import AttendanceSigningModal from '../components/emargement/AttendanceSigningModal';
import InstructorSigningModal from '../components/emargement/InstructorSigningModal';
import EnhancedAttendanceSheetModal from '../components/administration/EnhancedAttendanceSheetModal';
import AttendanceHistory from '../components/emargement/AttendanceHistory';
import SignatureManagementModal from '../components/ui/signature-management-modal';
import { PageHeader } from '@/components/ui/page-header';

const Emargement = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheet | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [isInstructorSigningModalOpen, setIsInstructorSigningModalOpen] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  const { userId, userRole, loading: userLoading } = useCurrentUser();

  const fetchTodaysAttendance = async () => {
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
      toast.error('Erreur lors du chargement des émargements');
      setAttendanceSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && userId && userRole) {
      fetchTodaysAttendance();
      loadUserSignature();
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [userId, userRole, userLoading]);

  const loadUserSignature = () => {
    if (userId) {
      const signature = localStorage.getItem(`user_signature_${userId}`);
      setUserSignature(signature);
    }
  };

  const handleSaveUserSignature = async (signatureData: string) => {
    if (signatureData) {
      localStorage.setItem(`user_signature_${userId}`, signatureData);
      setUserSignature(signatureData);
    } else {
      localStorage.removeItem(`user_signature_${userId}`);
      setUserSignature(null);
    }
  };

  const handleSignAttendance = (sheet: AttendanceSheet) => {
    setSelectedSheet(sheet);
    if (userRole === 'Formateur') {
      setIsInstructorSigningModalOpen(true);
    } else {
      setIsSigningModalOpen(true);
    }
  };

  const handleSignatureComplete = async () => {
    toast.success('Présence enregistrée avec succès !');
    await fetchTodaysAttendance();
  };

  const checkIfSigned = (sheet: AttendanceSheet) => {
    return sheet.signatures?.some(sig => 
      sig.user_id === userId && 
      (userRole === 'Formateur' ? sig.user_type === 'instructor' : sig.user_type === 'student')
    ) || false;
  };

  const isAttendanceOpen = (sheet: AttendanceSheet) => {
    return sheet.is_open_for_signing || false;
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header Section */}
      <div className="p-4 sm:p-6 lg:p-8 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <PageHeader 
          title="Gestion des Émargements"
          description="Suivez, signez et analysez les présences"
          icon={ClipboardCheck}
        />
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Badge Mon Pointage */}
        <div className="mb-6">
          <Badge className="bg-purple-600 text-white px-4 py-2 text-sm font-medium rounded-full">
            📋 Mon Pointage
          </Badge>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Mon Pointage</h2>
              <p className="text-sm text-gray-600">Cours du jour</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600 text-sm"
              >
                📅 Aujourd'hui
              </Button>
              <Button 
                variant="outline"
                className="border-gray-300 text-sm"
                onClick={() => setShowHistory(true)}
              >
                🕒 <span className="hidden sm:inline">Historique</span>
              </Button>
            </div>
          </div>

          {attendanceSheets.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {attendanceSheets.map((sheet) => {
                const isSigned = checkIfSigned(sheet);
                
                return (
                  <Card key={sheet.id} className="overflow-hidden hover:shadow-lg transition-all border border-gray-200">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{sheet.formations?.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {sheet.formations?.level}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 flex items-center mt-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Formateur: </span>
                            {sheet.instructor?.first_name} {sheet.instructor?.last_name}
                          </p>
                        </div>
                        <div className="text-left sm:text-right text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center sm:justify-end mb-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {sheet.start_time.substring(0, 5)} - {sheet.end_time.substring(0, 5)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        {!isSigned && isAttendanceOpen(sheet) ? (
                          <Button
                            onClick={() => handleSignAttendance(sheet)}
                            className="bg-green-600 hover:bg-green-700 text-white w-full text-sm sm:text-base"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">
                              {userRole === 'Formateur' ? 'Signer en tant que formateur' : 'Signer ma présence'}
                            </span>
                            <span className="sm:hidden">Signer</span>
                          </Button>
                        ) : isSigned ? (
                          <Button variant="outline" disabled className="bg-green-50 w-full text-sm sm:text-base">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            <span className="hidden sm:inline">
                              {userRole === 'Formateur' ? 'Cours validé' : 'Présence confirmée'}
                            </span>
                            <span className="sm:hidden">Signé</span>
                          </Button>
                        ) : !isAttendanceOpen(sheet) ? (
                          <Button variant="outline" disabled className="w-full text-sm sm:text-base">
                            <Clock className="h-4 w-4 mr-2" />
                            Émargement fermé
                          </Button>
                        ) : null}
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
                    Aucun cours aujourd'hui
                  </h3>
                  <p className="text-gray-600">
                    Il n'y a pas de cours programmé pour aujourd'hui.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de signature étudiant */}
      {selectedSheet && userId && (
        <AttendanceSigningModal
          isOpen={isSigningModalOpen}
          onClose={() => {
            setIsSigningModalOpen(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          userId={userId}
          userRole={userRole || 'Étudiant'}
          onSigned={handleSignatureComplete}
        />
      )}

      {/* Modal de signature formateur */}
      {selectedSheet && userId && (
        <InstructorSigningModal
          isOpen={isInstructorSigningModalOpen}
          onClose={() => {
            setIsInstructorSigningModalOpen(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          instructorId={userId}
          onSigned={handleSignatureComplete}
        />
      )}

      {/* Modal feuille d'émargement */}
      {selectedSheet && showAttendanceSheet && (
        <EnhancedAttendanceSheetModal
          isOpen={showAttendanceSheet}
          onClose={() => {
            setShowAttendanceSheet(false);
            setSelectedSheet(null);
          }}
          attendanceSheet={selectedSheet}
          onUpdate={fetchTodaysAttendance}
          onValidateSheet={async () => {
            await fetchTodaysAttendance();
            setShowAttendanceSheet(false);
            setSelectedSheet(null);
          }}
        />
      )}

      {/* Modal historique */}
      <AttendanceHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <SignatureManagementModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        currentSignature={userSignature}
        onSave={handleSaveUserSignature}
        title={`Gestion de ma signature ${userRole === 'Formateur' ? 'formateur' : 'étudiant'}`}
      />
    </div>
  );
};

export default Emargement;
