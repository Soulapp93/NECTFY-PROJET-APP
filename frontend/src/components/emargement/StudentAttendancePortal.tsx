import React, { useState, useEffect } from 'react';
import { Search, Users, Check, X, PenTool, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import SignaturePad from '@/components/ui/signature-pad';
import { supabase } from '@/integrations/supabase/client';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface StudentAttendancePortalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheetId: string;
  qrCode: string;
}

interface StudentInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  hasSignature: boolean;
}

const StudentAttendancePortal: React.FC<StudentAttendancePortalProps> = ({
  isOpen,
  onClose,
  attendanceSheetId,
  qrCode
}) => {
  const [attendanceSheet, setAttendanceSheet] = useState<AttendanceSheet | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signedStudents, setSignedStudents] = useState<Set<string>>(new Set());

  // Charger les données de la feuille d'émargement et les étudiants
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Récupérer la feuille d'émargement
      const { data: sheetData, error: sheetError } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level, color),
          users:instructor_id(first_name, last_name)
        `)
        .eq('id', attendanceSheetId)
        .single();

      if (sheetError) throw sheetError;

      setAttendanceSheet(sheetData as any);

      // Récupérer les étudiants inscrits à la formation
      let enrolledStudents: any[] = [];
      
      // Essai 1: student_formations
      const { data: sfData, error: sfError } = await supabase
        .from('student_formations')
        .select(`
          student_id,
          users!student_id(id, first_name, last_name, email, role)
        `)
        .eq('formation_id', sheetData.formation_id);

      if (!sfError && sfData && sfData.length > 0) {
        enrolledStudents = sfData.filter((e: any) => e.users?.role === 'Étudiant');
      }

      // Fallback: user_formation_assignments
      if (enrolledStudents.length === 0) {
        const { data: ufaData } = await supabase
          .from('user_formation_assignments')
          .select(`
            user_id,
            users!user_id(id, first_name, last_name, email, role)
          `)
          .eq('formation_id', sheetData.formation_id);

        if (ufaData) {
          enrolledStudents = ufaData
            .filter((e: any) => e.users?.role === 'Étudiant')
            .map((e: any) => ({ student_id: e.user_id, users: e.users }));
        }
      }

      console.log('Portal - Étudiants trouvés:', enrolledStudents.length);

      // Récupérer les signatures existantes
      const { data: signatures, error: signaturesError } = await supabase
        .from('attendance_signatures')
        .select('user_id')
        .eq('attendance_sheet_id', attendanceSheetId)
        .eq('user_type', 'student');

      if (signaturesError) throw signaturesError;

      const signedUserIds = new Set(signatures?.map(s => s.user_id) || []);
      setSignedStudents(signedUserIds);

      const studentsWithSignature: StudentInfo[] = enrolledStudents.map((enrollment: any) => ({
        id: enrollment.users?.id || enrollment.student_id,
        first_name: enrollment.users?.first_name || '',
        last_name: enrollment.users?.last_name || '',
        email: enrollment.users?.email || '',
        hasSignature: signedUserIds.has(enrollment.users?.id || enrollment.student_id)
      }));

      setStudents(studentsWithSignature);
      setFilteredStudents(studentsWithSignature);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Écouter les mises à jour temps réel des signatures
  useEffect(() => {
    if (!isOpen || !attendanceSheetId) return;

    loadData();

    // S'abonner aux changements de signatures en temps réel
    const channel = supabase
      .channel('student_attendance_portal')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheetId}`
        },
        (payload) => {
          if (payload.new.user_type === 'student') {
            setSignedStudents(prev => new Set([...prev, payload.new.user_id]));
            setStudents(prev => prev.map(student => 
              student.id === payload.new.user_id 
                ? { ...student, hasSignature: true }
                : student
            ));
            setFilteredStudents(prev => prev.map(student => 
              student.id === payload.new.user_id 
                ? { ...student, hasSignature: true }
                : student
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, attendanceSheetId]);

  // Filtrer les étudiants selon la recherche
  useEffect(() => {
    const filtered = students.filter(student =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleStudentSelect = (student: StudentInfo) => {
    if (student.hasSignature) {
      toast.info('Cet étudiant a déjà signé la feuille d\'émargement');
      return;
    }
    setSelectedStudent(student);
    setShowSignature(true);
  };

  const handleSignature = async (signatureData: string) => {
    if (!selectedStudent || !attendanceSheet) return;

    try {
      setSigning(true);
      
      // Vérifier si l'émargement est encore ouvert
      const isOpen = await attendanceService.checkIfAttendanceOpen(attendanceSheet.id);
      if (!isOpen) {
        toast.error('La session d\'émargement est fermée');
        return;
      }

      await attendanceService.signAttendanceSheet(
        attendanceSheet.id,
        selectedStudent.id,
        'student',
        signatureData
      );

      toast.success(`Signature enregistrée pour ${selectedStudent.first_name} ${selectedStudent.last_name} !`);
      
      // Mettre à jour l'état local
      setSignedStudents(prev => new Set([...prev, selectedStudent.id]));
      setStudents(prev => prev.map(student => 
        student.id === selectedStudent.id 
          ? { ...student, hasSignature: true }
          : student
      ));
      
      setShowSignature(false);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error('Error signing attendance:', error);
      toast.error(error.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const handleCancelSignature = () => {
    setShowSignature(false);
    setSelectedStudent(null);
  };

  const handleGoBack = () => {
    setShowSignature(false);
    setSelectedStudent(null);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3">Chargement...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!attendanceSheet) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <X className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Session introuvable
            </h3>
            <p className="text-gray-600 mb-4">
              La session d'émargement demandée n'existe pas ou n'est plus disponible.
            </p>
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showSignature && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="p-1 mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Users className="w-5 h-5" />
            {showSignature ? 'Signature électronique' : 'Émargement étudiant'}
          </DialogTitle>
        </DialogHeader>

        {!showSignature ? (
          /* Interface de sélection d'étudiant */
          <div className="space-y-4">
            {/* Informations de la session */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg" style={{ color: (attendanceSheet.formations as any)?.color || '#8B5CF6' }}>
                    {attendanceSheet.formations?.title}
                  </h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span>{format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                    <span>{attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</span>
                    {attendanceSheet.room && <span>Salle {attendanceSheet.room}</span>}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {attendanceSheet.formations?.level}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Statistiques */}
            <div className="flex justify-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{signedStudents.size}</div>
                <div className="text-gray-500">Signés</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{students.length - signedStudents.size}</div>
                <div className="text-gray-500">En attente</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{students.length}</div>
                <div className="text-gray-500">Total</div>
              </div>
            </div>

            {/* Liste des étudiants */}
            <ScrollArea className="h-64 border rounded-lg">
              <div className="space-y-2 p-4">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Aucun étudiant trouvé' : 'Aucun étudiant inscrit'}
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <Card
                      key={student.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        student.hasSignature ? 'opacity-60' : ''
                      }`}
                      onClick={() => handleStudentSelect(student)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </h4>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                          <div className="flex items-center">
                            {student.hasSignature ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <Check className="w-3 h-3 mr-1" />
                                Signé
                              </Badge>
                            ) : (
                              <Button size="sm" variant="outline">
                                <PenTool className="w-3 h-3 mr-1" />
                                Signer
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Code QR affiché */}
            <div className="text-center text-xs text-gray-500">
              Code session: {qrCode}
            </div>
          </div>
        ) : (
          /* Interface de signature */
          <div className="space-y-6">
            {/* Informations de l'étudiant sélectionné */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-lg">
                  Signature de {selectedStudent?.first_name} {selectedStudent?.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2 text-sm text-gray-600">
                  <div>{attendanceSheet.formations?.title}</div>
                  <div>{format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}</div>
                  <div>{attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Zone de signature */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Signature électronique
                  </h3>
                  <p className="text-sm text-gray-600">
                    Utilisez votre doigt ou un stylet pour signer ci-dessous
                  </p>
                  
                  <SignaturePad
                    width={400}
                    height={200}
                    onSave={handleSignature}
                    onCancel={handleCancelSignature}
                  />
                  
                  {signing && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Enregistrement en cours...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentAttendancePortal;