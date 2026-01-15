import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, FileText, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AttendanceSheet, attendanceService } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SignaturePad from '@/components/ui/signature-pad';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  userId: string;
  userRole: string;
  onSigned: () => void;
}

const AttendanceSigningModal: React.FC<AttendanceSigningModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  userId,
  userRole,
  onSigned
}) => {
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  // Charger la signature sauvegardée de l'utilisateur
  useEffect(() => {
    const loadSavedSignature = async () => {
      if (!isOpen || !userId) return;
      
      try {
        const { data, error } = await supabase
          .from('user_signatures' as any)
          .select('signature_data')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle() as any;

        if (error) {
          console.error('Error loading saved signature:', error);
          return;
        }

        if (data?.signature_data) {
          setSavedSignature(data.signature_data);
        }
      } catch (error) {
        console.error('Error loading saved signature:', error);
      }
    };

    loadSavedSignature();
  }, [isOpen, userId]);

  const handleStartSigning = () => {
    setShowSignature(true);
  };

  const handleSignature = async (signatureData: string) => {
    try {
      setSigning(true);
      const userType = userRole === 'Formateur' ? 'instructor' : 'student';
      
      await attendanceService.signAttendanceSheet(
        attendanceSheet.id,
        userId,
        userType,
        signatureData
      );

      toast.success('Présence signée avec succès !');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pointer ma présence</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du cours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">
                {attendanceSheet.formations?.title}
              </CardTitle>
              <div className="text-center">
                <Badge variant="outline">{attendanceSheet.formations?.level}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</span>
                </div>
                {attendanceSheet.room && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Salle {attendanceSheet.room}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{userRole}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!showSignature ? (
            /* Interface de confirmation */
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Confirmation de présence</h3>
                    <p className="text-gray-600">
                      Vous êtes sur le point de confirmer votre présence pour ce cours.
                      Une signature électronique sera requise.
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={onClose}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleStartSigning}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Pointer ma présence
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Interface de signature */
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Signature électronique</CardTitle>
                <p className="text-center text-gray-600">
                  Veuillez signer ci-dessous pour confirmer votre présence
                </p>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SignaturePad
                  width={400}
                  height={200}
                  onSave={handleSignature}
                  onCancel={handleCancelSignature}
                  initialSignature={savedSignature || undefined}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceSigningModal;