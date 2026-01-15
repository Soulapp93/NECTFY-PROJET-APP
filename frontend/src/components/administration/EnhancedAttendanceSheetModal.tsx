import React, { useState, useEffect } from 'react';
import { X, Edit, Download, CheckCircle2, CheckCircle, XCircle, Clock, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AttendanceSheet, attendanceService } from '@/services/attendanceService';
import { pdfExportService } from '@/services/pdfExportService';
import AdminValidationModal from './AdminValidationModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface EnhancedAttendanceSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onUpdate: () => void;
  onValidateSheet: (sheet: AttendanceSheet) => Promise<void>;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  formation: string;
  signature?: {
    id: string;
    attendance_sheet_id: string;
    user_id: string;
    user_type: string;
    signature_data?: string;
    signed_at: string;
    present: boolean;
    absence_reason?: string;
    absence_reason_type?: string;
    created_at: string;
    updated_at: string;
    users?: {
      first_name: string;
      last_name: string;
      email: string;
    } | null;
  };
}

const ABSENCE_MOTIFS = [
  'Congé',
  'Maladie', 
  'Mission professionnelle',
  'Familiale',
  'Autre'
];

const EnhancedAttendanceSheetModal: React.FC<EnhancedAttendanceSheetModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onUpdate,
  onValidateSheet
}) => {
  const { userId } = useCurrentUser();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [students, setStudents] = useState<Student[]>([]);
  const [adminSignature, setAdminSignature] = useState<string>('');
  const [instructorSignature, setInstructorSignature] = useState<string>('');
  const [instructorName, setInstructorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [establishmentInfo, setEstablishmentInfo] = useState<{ logo_url: string | null; name: string } | null>(null);

  // Charger les données de la feuille d'émargement
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les signatures séparément
      const { data: signatures, error: signaturesError } = await supabase
        .from('attendance_signatures')
        .select(`
          *,
          users(first_name, last_name, email)
        `)
        .eq('attendance_sheet_id', attendanceSheet.id);

      if (signaturesError) throw signaturesError;

      // Récupérer les étudiants inscrits à la formation
      // IMPORTANT: Exclure le formateur de la liste des participants
      const instructorIdToExclude = attendanceSheet.instructor_id;
      
      let enrolledStudents: any[] = [];
      
      // Essai 1: student_formations - filtrer strictement les étudiants
      const { data: sfData, error: sfError } = await supabase
        .from('student_formations')
        .select(`
          student_id,
          users!student_id(id, first_name, last_name, email, role)
        `)
        .eq('formation_id', attendanceSheet.formation_id);

      if (!sfError && sfData && sfData.length > 0) {
        // FILTRER STRICTEMENT : uniquement rôle "Étudiant" ET exclure explicitement le formateur
        enrolledStudents = sfData.filter(
          (e: any) => e.users?.role === 'Étudiant' && e.users?.id !== instructorIdToExclude
        );
      }

      // Fallback: user_formation_assignments si student_formations est vide
      if (enrolledStudents.length === 0) {
        const { data: ufaData, error: ufaError } = await supabase
          .from('user_formation_assignments')
          .select(`
            user_id,
            users!user_id(id, first_name, last_name, email, role)
          `)
          .eq('formation_id', attendanceSheet.formation_id);

        if (!ufaError && ufaData) {
          // FILTRER STRICTEMENT : uniquement rôle "Étudiant" ET exclure le formateur
          enrolledStudents = ufaData
            .filter((e: any) => e.users?.role === 'Étudiant' && e.user_id !== instructorIdToExclude)
            .map((e: any) => ({ student_id: e.user_id, users: e.users }));
        }
      }

      console.log('Étudiants inscrits (modal admin, après filtrage):', enrolledStudents.length, 'Formateur exclu:', instructorIdToExclude);

      // Récupérer uniquement les signatures d'étudiants (user_type = 'student')
      const studentSignatures = signatures?.filter((sig: any) => sig.user_type === 'student') || [];

      // Mapper les étudiants avec leurs signatures
      const mappedStudents: Student[] = enrolledStudents.map((enrollment: any) => {
        const studentId = enrollment.users?.id || enrollment.student_id;
        return {
          id: studentId,
          firstName: enrollment.users?.first_name || '',
          lastName: enrollment.users?.last_name || '',
          formation: (attendanceSheet.formations as any)?.title || '',
          signature: studentSignatures.find((sig: any) => sig.user_id === studentId)
        };
      });

      setStudents(mappedStudents);
      
      // Charger les signatures existantes si disponibles
      console.log('Signatures récupérées:', signatures);
      console.log('instructor_id de la feuille:', attendanceSheet.instructor_id);
      console.log('validated_by de la feuille:', attendanceSheet.validated_by);
      
      // Signature du formateur: prendre la première signature de type "instructor",
      // même si instructor_id n'est pas renseigné sur la feuille
      const instructorSigRecord = signatures?.find((sig: any) => sig.user_type === 'instructor');
      const instrSig = instructorSigRecord?.signature_data;
      
      console.log('Signature formateur trouvée:', !!instrSig);
      console.log('ID formateur (attendance_sheet.instructor_id):', attendanceSheet.instructor_id);

      if (instrSig) {
        console.log('Utilisation de la signature formateur persistée');
        setInstructorSignature(instrSig);
        if (instructorSigRecord?.users) {
          setInstructorName(`${instructorSigRecord.users.first_name} ${instructorSigRecord.users.last_name}`);
        }
      }

      // Charger la signature administrative depuis user_signatures si possible
      const adminId = attendanceSheet.validated_by || userId;
      if (adminId) {
        console.log('Chargement signature admin pour utilisateur:', adminId);
        const { data: adminSigData, error: adminSigError } = await supabase
          .from('user_signatures')
          .select('signature_data')
          .eq('user_id', adminId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (adminSigError) {
          console.error('Erreur récupération signature admin:', adminSigError);
        } else if (adminSigData && adminSigData.signature_data) {
          console.log('Signature admin trouvée dans user_signatures');
          setAdminSignature(adminSigData.signature_data);
        } else {
          console.log('Aucune signature admin trouvée dans user_signatures');
          setAdminSignature('');
        }
      }

      // Load establishment info for logo
      if (attendanceSheet.formation_id) {
        const { data: formationData, error: formationError } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', attendanceSheet.formation_id)
          .single();
        
        if (!formationError && formationData?.establishment_id) {
          const { data: establishmentData, error: establishmentError } = await supabase
            .from('establishments')
            .select('logo_url, name')
            .eq('id', formationData.establishment_id)
            .single();
          
          if (!establishmentError && establishmentData) {
            setEstablishmentInfo(establishmentData);
          }
        }
      }

    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!isOpen || !attendanceSheet.id) return;

    loadAttendanceData();

    const channel = supabase
      .channel(`enhanced_attendance_modal_${attendanceSheet.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheet.id}`
        },
        () => {
          console.log('Real-time update detected in modal');
          loadAttendanceData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_sheets',
          filter: `id=eq.${attendanceSheet.id}`
        },
        () => {
          console.log('Attendance sheet updated');
          loadAttendanceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, attendanceSheet.id]);

  const handleStudentStatusChange = (studentId: string, present: boolean, absenceReason?: string) => {
    console.log('Update student status:', { studentId, present, absenceReason });
  };

  const handleExportPDF = async () => {
    try {
      await pdfExportService.exportAttendanceSheetSimple(attendanceSheet);
      toast.success("Feuille d'émargement exportée en PDF");
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const handleValidateSheet = async () => {
    try {
      await onValidateSheet(attendanceSheet);
    } catch (error) {
      console.error('Error validating attendance sheet from modal:', error);
      // Le parent gère déjà les toasts, on évite le doublon ici
    }
  };

  const getStatusInfo = (student: Student) => {
    if (!student.signature) {
      return {
        status: 'Absent',
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        bgColor: 'bg-red-50',
        textColor: 'text-red-700'
      };
    }
    
    if (student.signature.present) {
      return {
        status: 'Présent',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
      };
    }

    return {
      status: 'Absent',
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    };
  };


  if (loading || !attendanceSheet) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de la feuille d'émargement...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formationColor = (attendanceSheet.formations as any)?.color || '#8B5CF6';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Feuille d'émargement</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white">
          {/* En-tête */}
          <div 
            className="p-8 text-white relative"
            style={{ backgroundColor: formationColor }}
          >
            {/* Logo établissement en haut à gauche */}
            {establishmentInfo && (
              <div className="absolute top-4 left-4 flex items-center gap-3">
                {establishmentInfo.logo_url ? (
                  <div className="bg-white rounded-lg p-1.5 shadow-md">
                    <img 
                      src={establishmentInfo.logo_url} 
                      alt={establishmentInfo.name}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-white/20 rounded-lg p-2">
                    <Building className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-white/90">{establishmentInfo.name}</p>
                </div>
              </div>
            )}
            
            <div className={`text-center ${establishmentInfo ? 'pt-12' : ''}`}>
              <h1 className="text-4xl font-bold mb-6">FEUILLE D'ÉMARGEMENT</h1>
              {attendanceSheet.session_type === 'autonomie' && (
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-100 px-4 py-1 rounded-full text-sm mb-4">
                  Session en autonomie
                </div>
              )}
              <div className="space-y-2 text-base">
                <div className="font-semibold text-xl">{attendanceSheet.formations?.title}</div>
                {(attendanceSheet as any).schedule_slots?.formation_modules?.title && (
                  <div className="font-medium text-white/90">📚 Module : {(attendanceSheet as any).schedule_slots.formation_modules.title}</div>
                )}
                <div className="font-medium">{attendanceSheet.title}</div>
                <div className="flex items-center justify-center gap-8 text-sm mt-4 flex-wrap">
                  <div>📅 {format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}</div>
                  <div>🕒 {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</div>
                  <div>🏫 {attendanceSheet.room || 'Salle non spécifiée'}</div>
                  {attendanceSheet.session_type !== 'autonomie' && (
                    <div>👨‍🏫 {(attendanceSheet as any).instructor ? `${(attendanceSheet as any).instructor.first_name} ${(attendanceSheet as any).instructor.last_name}` : 'Non assigné'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Liste des participants */}
          <div className="p-6">
            <h4 className="font-semibold mb-4">Liste des participants ({students.length})</h4>
            
            {/* Statistiques en temps réel */}
            <div className="mb-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700">Présents: {students.filter(s => s.signature?.present).length}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700">Absents: {students.filter(s => !s.signature || !s.signature.present).length}</span>
              </div>
            </div>
            
            {/* En-tête du tableau */}
            <div 
              className="grid grid-cols-4 gap-4 p-3 text-white font-medium text-sm rounded-t-lg"
              style={{ backgroundColor: formationColor }}
            >
              <div className="col-span-2">Nom et Prénom</div>
              <div className="text-center">Statut</div>
              <div className="text-center">Signature</div>
            </div>

            {/* Lignes des étudiants */}
            <div className="border border-gray-200 rounded-b-lg">
              {students.map((student, index) => {
                const statusInfo = getStatusInfo(student);
                return (
                  <div 
                    key={student.id}
                    className={`grid grid-cols-4 gap-4 p-3 border-b border-gray-200 last:border-b-0 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: formationColor }}
                      >
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">{student.lastName} {student.firstName}</div>
                        <div className="text-sm text-gray-500">{student.formation}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      {mode === 'edit' ? (
                        <Select 
                          value={statusInfo.status} 
                          onValueChange={(value: string) => {
                            const present = value === 'Présent';
                            const absenceReason = !present ? 'Autre' : undefined;
                            handleStudentStatusChange(student.id, present, absenceReason);
                          }}
                        >
                          <SelectTrigger className="w-32 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Présent">Présent</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                          {statusInfo.icon}
                          <span className={`text-xs font-medium ${statusInfo.textColor}`}>
                            {statusInfo.status}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      {student.signature ? (
                        <div className="text-center">
                          {student.signature.signature_data ? (
                            <img 
                              src={student.signature.signature_data} 
                              alt="Signature" 
                              className="h-8 w-auto mx-auto mb-1"
                            />
                          ) : (
                            <div className="h-8 flex items-center justify-center text-xs text-gray-500">
                              Signé électroniquement
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {format(new Date(student.signature.signed_at), 'HH:mm', { locale: fr })}
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-12 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                          <span className="text-xs text-gray-400">Non signé</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signatures des responsables */}
          <div className="p-6 border-t">
            <div className={`grid gap-8 ${attendanceSheet.session_type === 'autonomie' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {/* Signature formateur - masquée pour les sessions en autonomie */}
              {attendanceSheet.session_type !== 'autonomie' && (
                <div>
                  <h4 className="font-semibold mb-3">Signature du Formateur</h4>
                  <div className="border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-center justify-center p-2">
                    {instructorSignature ? (
                      <img 
                        src={instructorSignature} 
                        alt="Signature formateur" 
                        className="h-16 w-auto"
                      />
                    ) : (
                      <div className="text-xs text-gray-500 text-center">
                        En attente de signature
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-600 border-t pt-2">
                    {instructorName
                      ? instructorName
                      : (attendanceSheet as any).instructor
                      ? `${(attendanceSheet as any).instructor.first_name} ${(attendanceSheet as any).instructor.last_name}`
                      : 'Formateur non assigné'}
                  </div>
                </div>
              )}
              <div className={attendanceSheet.session_type === 'autonomie' ? 'max-w-md mx-auto' : ''}>
                <h4 className="font-semibold mb-3">Signature de l'Administration</h4>
                <div className="border border-gray-300 rounded-lg h-24 bg-gray-50 flex items-center justify-center p-2">
                  {attendanceSheet.validated_by && adminSignature ? (
                    <img 
                      src={adminSignature} 
                      alt="Signature administration" 
                      className="h-16 w-auto"
                    />
                  ) : (
                    <div className="text-xs text-gray-500 text-center">
                      {attendanceSheet.status === 'Validé' ? 'Signature non disponible' : 'En attente de validation'}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center text-sm text-gray-600 border-t pt-2">
                  Administration
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-500">
            Document généré le {format(new Date(), 'PPP à HH:mm', { locale: fr })} - NECTFY
          </div>
        </div>

        {/* Actions footer */}
        <div className="flex justify-between items-center p-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
          
          <div className="flex gap-2">
            {attendanceSheet.status !== 'Validé' && (
              <Button onClick={handleValidateSheet} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Valider
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de validation administrative */}
      {showValidationModal && (
        <AdminValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          attendanceSheet={attendanceSheet}
          onValidate={async (signatureData?: string) => {
            try {
              // On délègue la validation au parent via onValidateSheet qui réutilise
              // la même logique que le bouton "Valider" de la liste
              await onValidateSheet(attendanceSheet);
            } catch (error) {
              console.error('Error validating from AdminValidationModal in modal:', error);
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default EnhancedAttendanceSheetModal;
