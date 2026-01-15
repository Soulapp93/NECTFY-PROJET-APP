import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, FileText, PenTool, BookOpen, UserCheck } from 'lucide-react';
import SignaturePad from '@/components/ui/signature-pad';
import { AttendanceSheet } from '@/services/attendanceService';
import { attendanceService } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';

interface InstructorSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  instructorId: string;
  onSigned: () => void;
}

const InstructorSigningModal: React.FC<InstructorSigningModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  instructorId,
  onSigned
}) => {
  const { userId, loading } = useCurrentUser();
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [moduleInfo, setModuleInfo] = useState<{ title: string } | null>(null);
  const [instructorInfo, setInstructorInfo] = useState<{ first_name: string; last_name: string } | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [loadingSignature, setLoadingSignature] = useState(false);
  
  // Utiliser l'ID de l'utilisateur actuel si disponible, sinon l'instructorId fourni
  const effectiveInstructorId = userId || instructorId;
  
  // Charger les informations du module et du formateur + signature enregistrée
  useEffect(() => {
    const loadAdditionalInfo = async () => {
      if (!isOpen || !attendanceSheet) return;

      try {
        console.log('Loading additional info for attendance sheet:', attendanceSheet.schedule_slot_id);
        
        // Récupérer les informations du module via schedule_slot
        if (attendanceSheet.schedule_slot_id) {
          const { data: slotData, error: slotError } = await supabase
            .from('schedule_slots')
            .select(`
              module_id,
              formation_modules!module_id(title)
            `)
            .eq('id', attendanceSheet.schedule_slot_id)
            .single();

          console.log('Schedule slot data:', { slotData, slotError });

          if (slotData?.formation_modules) {
            console.log('Module found:', slotData.formation_modules);
            setModuleInfo(slotData.formation_modules as { title: string });
          } else {
            // Fallback: utiliser le titre de la feuille d'émargement
            console.log('No module found, using attendance sheet title as fallback');
            setModuleInfo({ title: attendanceSheet.title || 'Module non spécifié' });
          }
        } else {
          // Fallback: utiliser le titre de la feuille d'émargement
          setModuleInfo({ title: attendanceSheet.title || 'Module non spécifié' });
        }

        // Récupérer les informations du formateur
        if (attendanceSheet.instructor_id) {
          const { data: instructorData, error: instructorError } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', attendanceSheet.instructor_id)
            .single();

          console.log('Instructor data:', { instructorData, instructorError });

          if (instructorData) {
            setInstructorInfo(instructorData);
          }
        }

        // Charger la signature enregistrée du formateur
        if (effectiveInstructorId) {
          setLoadingSignature(true);
          const { data: signatureData, error: signatureError } = await supabase
            .from('user_signatures')
            .select('signature_data')
            .eq('user_id', effectiveInstructorId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          console.log('Signature data:', { signatureData, signatureError });

          if (signatureData?.signature_data) {
            setSavedSignature(signatureData.signature_data);
            console.log('Signature enregistrée chargée pour le formateur');
          }
          setLoadingSignature(false);
        }
      } catch (error) {
        console.error('Error loading additional info:', error);
        // En cas d'erreur, utiliser le titre de la feuille d'émargement comme fallback
        setModuleInfo({ title: attendanceSheet.title || 'Module non spécifié' });
        setLoadingSignature(false);
      }
    };

    loadAdditionalInfo();
  }, [isOpen, attendanceSheet, effectiveInstructorId]);

  console.log('InstructorSigningModal component loaded', { 
    userId, 
    instructorId, 
    effectiveInstructorId,
    attendanceSheetInstructorId: attendanceSheet?.instructor_id,
    attendanceSheetInstructor: attendanceSheet?.instructor,
    moduleInfo,
    instructorInfo
  });
  
  const handleStartSigning = () => {
    if (!effectiveInstructorId) {
      toast.error('Impossible de démarrer la signature : utilisateur non identifié');
      return;
    }
    setShowSignature(true);
  };

  const handleSignature = async (signatureData: string) => {
    try {
      setSigning(true);
      
      console.log('Attempting to sign with ID:', effectiveInstructorId);
      
      if (!effectiveInstructorId || effectiveInstructorId.trim() === '') {
        throw new Error('ID formateur manquant - utilisateur non connecté');
      }
      
      // Signer la feuille d'émargement en tant que formateur
      console.log('Calling attendanceService.signAttendanceSheet with:', {
        attendanceSheetId: attendanceSheet.id,
        userId: effectiveInstructorId,
        userType: 'instructor',
        signatureData: signatureData ? 'present' : 'empty'
      });
      
      await attendanceService.signAttendanceSheet(
        attendanceSheet.id,
        effectiveInstructorId,
        'instructor',
        signatureData
      );

      // Envoyer automatiquement la feuille à l'administration
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('attendance_sheets')
        .update({ 
          status: 'En attente de validation',
          closed_at: new Date().toISOString()
        })
        .eq('id', attendanceSheet.id);

      toast.success('Signature enregistrée et feuille envoyée à l\'administration ! ✍️📤');
      onSigned();
      onClose();
    } catch (error: any) {
      console.error('Error signing attendance:', error);
      toast.error(error.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const handleCancelSignature = () => {
    setShowSignature(false);
  };

  const isAlreadySigned = attendanceSheet.signatures?.some(
    sig => sig.user_id === effectiveInstructorId && sig.user_type === 'instructor'
  );

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
            <span>Chargement des données utilisateur...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!effectiveInstructorId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center p-8">
            <div className="text-red-600 mb-4">
              ⚠️ Erreur d'authentification
            </div>
            <p className="text-gray-600 mb-6">
              Impossible de vous identifier. Veuillez vous reconnecter.
            </p>
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-purple-700">
            🎓 Signature Formateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du cours */}
          <Card className="border border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="text-lg text-purple-800">
                Informations du Cours
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-700">
                  <FileText className="h-4 w-4 mr-2 text-purple-600" />
                  <div>
                    <span className="font-medium">Formation:</span>
                    <div className="text-gray-900 font-semibold">
                      {attendanceSheet.formations?.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {attendanceSheet.formations?.level}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
                  <div>
                    <span className="font-medium">Module:</span>
                    <div className="text-gray-900 font-semibold">
                      {moduleInfo?.title || attendanceSheet.title || 'Module non spécifié'}
                    </div>
                  </div>
                </div>

                {instructorInfo && (
                  <div className="flex items-center text-gray-700">
                    <UserCheck className="h-4 w-4 mr-2 text-purple-600" />
                    <div>
                      <span className="font-medium">Formateur:</span>
                      <div className="text-gray-900 font-semibold">
                        {instructorInfo.first_name} {instructorInfo.last_name}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                  <div>
                    <span className="font-medium">Date:</span>
                    <div className="text-gray-900">
                      {format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Clock className="h-4 w-4 mr-2 text-purple-600" />
                  <div>
                    <span className="font-medium">Horaires:</span>
                    <div className="text-gray-900">
                      {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}
                    </div>
                  </div>
                </div>
                
                {attendanceSheet.room && (
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 mr-2 text-purple-600" />
                    <div>
                      <span className="font-medium">Salle:</span>
                      <div className="text-gray-900">{attendanceSheet.room}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Statut de la session */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Statut:</span>
                  <Badge 
                    variant="outline" 
                    className={
                      attendanceSheet.status === 'En cours' 
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : attendanceSheet.status === 'En attente de validation'
                        ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                        : 'border-gray-200 bg-gray-50 text-gray-800'
                    }
                  >
                    {attendanceSheet.status}
                  </Badge>
                </div>
                
                {isAlreadySigned && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✓ Déjà signé
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Interface de signature */}
          {!isAlreadySigned && (
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                {!showSignature ? (
                  <div className="text-center space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Confirmation de présence
                      </h3>
                      <p className="text-blue-800 text-sm">
                        En signant cette feuille d'émargement, vous confirmez avoir dispensé ce cours 
                        et validez la présence des étudiants.
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleStartSigning}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                      size="lg"
                    >
                      <PenTool className="h-5 w-5 mr-2" />
                      Commencer la signature
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Veuillez signer ci-dessous
                      </h3>
                      <p className="text-sm text-gray-600">
                        Utilisez votre doigt ou votre stylet pour signer
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {loadingSignature ? (
                        <div className="text-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Chargement de votre signature...</p>
                        </div>
                      ) : (
                        <SignaturePad
                          onSave={handleSignature}
                          onCancel={handleCancelSignature}
                          width={500}
                          height={200}
                          initialSignature={savedSignature || undefined}
                        />
                      )}
                      
                      {signing && (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-sm text-gray-600 mt-2">Enregistrement en cours...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Statistiques rapides */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Présences du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceSheet.signatures?.filter(s => s.present && s.user_type === 'student').length || 0}
                  </div>
                  <div className="text-xs text-green-700">Présents</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceSheet.signatures?.filter(s => !s.present && s.user_type === 'student').length || 0}
                  </div>
                  <div className="text-xs text-red-700">Absents</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceSheet.signatures?.filter(s => s.user_type === 'student').length || 0}
                  </div>
                  <div className="text-xs text-blue-700">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={signing}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructorSigningModal;