import React, { useState } from 'react';
import { QrCode, Hash, Calendar, Clock, MapPin, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QRCodeScannerModal from './QRCodeScannerModal';
import CodeInputModal from './CodeInputModal';
import QRCodeDisplayModal from './QRCodeDisplayModal';
import { toast } from 'sonner';

interface QRAttendanceCardProps {
  attendanceSheet: AttendanceSheet;
  userRole: string;
  isAlreadySigned: boolean;
  isAttendanceOpen: boolean;
}

const QRAttendanceCard: React.FC<QRAttendanceCardProps> = ({
  attendanceSheet,
  userRole,
  isAlreadySigned,
  isAttendanceOpen
}) => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showQRDisplay, setShowQRDisplay] = useState(false);

  const handleQRCodeScanned = (qrData: string) => {
    console.log('QR Code scanned:', qrData);
    toast.success('Émargement effectué avec succès !');
    // Ici on traiterait les données du QR code
  };

  const handleCodeSubmitted = (code: string) => {
    console.log('Code submitted:', code);
    // Ici on traiterait le code numérique
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En cours':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'En attente':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'En attente de validation':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'Validé':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-tight">
              {attendanceSheet.title}
            </CardTitle>
            <Badge className={getStatusColor(attendanceSheet.status)}>
              {attendanceSheet.status}
            </Badge>
          </div>
          {attendanceSheet.formations && (
            <p className="text-sm text-muted-foreground">
              {attendanceSheet.formations.title} - {attendanceSheet.formations.level}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Informations de la session */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(attendanceSheet.date), 'PPP', { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</span>
            </div>
            {attendanceSheet.room && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Salle {attendanceSheet.room}</span>
              </div>
            )}
          </div>

          {/* Statut d'émargement */}
          {isAlreadySigned && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Vous êtes déjà émargé pour cette session
              </span>
            </div>
          )}

          {!isAttendanceOpen && !isAlreadySigned && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-700">
                L'émargement n'est pas encore ouvert pour cette session
              </span>
            </div>
          )}

          {/* Actions selon le rôle */}
          {userRole === 'Étudiant' && isAttendanceOpen && !isAlreadySigned && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-center mb-3">
                Choisissez votre méthode d'émargement :
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShowQRScanner(true)}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-xs">Scanner QR</span>
                </Button>
                <Button
                  onClick={() => setShowCodeInput(true)}
                  className="flex flex-col gap-2 h-auto py-4"
                  variant="outline"
                >
                  <Hash className="w-6 h-6" />
                  <span className="text-xs">Saisir Code</span>
                </Button>
              </div>
            </div>
          )}

          {(userRole === 'Formateur' || userRole === 'Admin') && isAttendanceOpen && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowQRDisplay(true)}
                className="w-full flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Afficher QR Code & Code d'émargement
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Users className="w-3 h-3" />
                <span>Les étudiants peuvent maintenant s'émarger</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <QRCodeScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onQRCodeScanned={handleQRCodeScanned}
      />

      <CodeInputModal
        isOpen={showCodeInput}
        onClose={() => setShowCodeInput(false)}
        onCodeSubmitted={handleCodeSubmitted}
      />

      <QRCodeDisplayModal
        isOpen={showQRDisplay}
        onClose={() => setShowQRDisplay(false)}
        attendanceSheet={attendanceSheet}
      />
    </>
  );
};

export default QRAttendanceCard;