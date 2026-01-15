import React, { useState } from 'react';
import { CheckCircle, FileText, PenTool, Users, Calendar, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import SignaturePad from '@/components/ui/signature-pad';
import { AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface AdminAttendanceValidationProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onValidate: (signatureData?: string) => Promise<void>;
}

const AdminAttendanceValidation: React.FC<AdminAttendanceValidationProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onValidate
}) => {
  const [showSignature, setShowSignature] = useState(false);
  const [validating, setValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'review' | 'signature' | 'confirm'>('review');

  const handleStartValidation = () => {
    setCurrentStep('signature');
    setShowSignature(true);
  };

  const handleSignature = async (signatureData: string) => {
    try {
      setValidating(true);
      await onValidate(signatureData);
      toast.success('Feuille d\'émargement validée avec succès !');
      onClose();
    } catch (error: any) {
      console.error('Error validating attendance:', error);
      toast.error(error.message || 'Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  const handleCancelSignature = () => {
    setShowSignature(false);
    setCurrentStep('review');
  };

  const presentCount = attendanceSheet.signatures?.filter(s => s.present && s.user_type === 'student').length || 0;
  const absentCount = attendanceSheet.signatures?.filter(s => !s.present && s.user_type === 'student').length || 0;
  const instructorSignature = attendanceSheet.signatures?.find(s => s.user_type === 'instructor');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Validation administrative - Feuille d'émargement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {currentStep === 'review' && (
            <>
              {/* Informations de la session */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de la session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="font-medium">{attendanceSheet.formations?.title}</div>
                          <div className="text-sm text-gray-600">{attendanceSheet.formations?.level}</div>
                        </div>
                      </div>

                      {attendanceSheet.title && (
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="text-sm text-gray-600">Module:</div>
                            <div className="font-medium">{attendanceSheet.title}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="font-medium">
                            {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {attendanceSheet.room && (
                        <div>
                          <span className="text-sm text-gray-600">Salle:</span>
                          <div className="font-medium">{attendanceSheet.room}</div>
                        </div>
                      )}

                      <div>
                        <span className="text-sm text-gray-600">Formateur:</span>
                        <div className="font-medium">
                          {attendanceSheet.instructor 
                            ? `${attendanceSheet.instructor.first_name} ${attendanceSheet.instructor.last_name}`
                            : 'Non assigné'
                          }
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600">Statut:</span>
                        <div>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            {attendanceSheet.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques de présence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Résumé des présences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-green-600">{presentCount}</div>
                      <div className="text-sm text-green-700">Présents</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-red-600">{absentCount}</div>
                      <div className="text-sm text-red-700">Absents</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-3xl font-bold text-blue-600">{presentCount + absentCount}</div>
                      <div className="text-sm text-blue-700">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Signature du formateur */}
              <Card>
                <CardHeader>
                  <CardTitle>Signature du formateur</CardTitle>
                </CardHeader>
                <CardContent>
                  {instructorSignature ? (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-800">Formateur signé</div>
                        <div className="text-sm text-green-600">
                          Signé le {format(new Date(instructorSignature.signed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center text-orange-800">
                      ⚠️ Le formateur n'a pas encore signé cette feuille
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleStartValidation}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Valider et signer
                </Button>
              </div>
            </>
          )}

          {currentStep === 'signature' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Signature administrative</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Validation de la feuille d'émargement</h3>
                  <p className="text-sm text-gray-600">
                    En signant, vous certifiez avoir vérifié et validé cette feuille d'émargement
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    <strong>Résumé:</strong> {presentCount} présent(s), {absentCount} absent(s) pour la session 
                    "{attendanceSheet.formations?.title}" du {format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>

                <SignaturePad
                  width={500}
                  height={200}
                  onSave={handleSignature}
                  onCancel={handleCancelSignature}
                />

                {validating && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Validation en cours...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAttendanceValidation;