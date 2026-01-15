import React, { useState, useEffect } from 'react';
import { QrCode, Hash, Users, Clock, RefreshCw, Eye, EyeOff } from 'lucide-react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AttendanceSheet } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QRCodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
}

const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet
}) => {
  const [currentCode, setCurrentCode] = useState('');
  const [qrCodeImage, setQRCodeImage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [signedCount, setSignedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showCode, setShowCode] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Charger les statistiques réelles d'émargement
  const loadRealStats = async () => {
    try {
      // Récupérer le nombre total d'étudiants (role = 'Étudiant' uniquement)
      let total = 0;
      
      const { data: sfData } = await supabase
        .from('student_formations')
        .select('student_id, users!student_id(role)')
        .eq('formation_id', attendanceSheet.formation_id);

      if (sfData && sfData.length > 0) {
        total = sfData.filter((e: any) => e.users?.role === 'Étudiant').length;
      } else {
        // Fallback
        const { data: ufaData } = await supabase
          .from('user_formation_assignments')
          .select('user_id, users!user_id(role)')
          .eq('formation_id', attendanceSheet.formation_id);
        
        if (ufaData) {
          total = ufaData.filter((e: any) => e.users?.role === 'Étudiant').length;
        }
      }

      setTotalStudents(total);

      // Récupérer le nombre de signatures étudiants
      const { data: signatures } = await supabase
        .from('attendance_signatures')
        .select('user_id')
        .eq('attendance_sheet_id', attendanceSheet.id)
        .eq('user_type', 'student');

      setSignedCount(signatures?.length || 0);
    } catch (error) {
      console.error('Error loading real stats:', error);
    }
  };

  // Écouter les mises à jour en temps réel des signatures
  useEffect(() => {
    if (!isOpen) return;

    loadRealStats();

    // S'abonner aux nouvelles signatures en temps réel
    const channel = supabase
      .channel(`qr_display_${attendanceSheet.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheet.id}`
        },
        (payload) => {
          if (payload.new.user_type === 'student') {
            setSignedCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, attendanceSheet.id]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeRemaining]);

  // Générer un nouveau QR code avec validation sécurisée
  const generateNewCode = async () => {
    setIsRegenerating(true);
    
    try {
      // Générer un nouveau code unique (6 chiffres)
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // URL que le QR code encode
      const qrData = `${window.location.origin}/emargement-qr?code=${newCode}`;
      
      // Générer l'image QR code
      const qrImageUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Sauvegarder le code dans la base de données
      const { error } = await supabase
        .from('attendance_sheets')
        .update({ 
          qr_code: newCode
        })
        .eq('id', attendanceSheet.id);

      if (error) throw error;

      setCurrentCode(newCode);
      setQRCodeImage(qrImageUrl);
      setTimeRemaining(30 * 60); // Reset timer
      
      toast.success('Nouveau code QR généré !');
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error('Erreur lors de la génération du code QR');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Initialiser le QR code à l'ouverture
  useEffect(() => {
    if (isOpen) {
      generateNewCode();
    }
  }, [isOpen, attendanceSheet.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeRemaining / (30 * 60)) * 100;
  const attendanceRate = totalStudents > 0 ? Math.round((signedCount / totalStudents) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Émargement QR Code - {attendanceSheet.formations?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de la session */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Session en cours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date:</span>
                <span>{format(new Date(attendanceSheet.date), 'PPP', { locale: fr })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horaire:</span>
                <span>{attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Salle:</span>
                <span>{attendanceSheet.room || 'Non spécifiée'}</span>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code d'émargement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {/* QR Code réel */}
              <div className="mx-auto w-48 h-48 bg-white border-4 border-gray-200 rounded-lg flex items-center justify-center">
                {qrCodeImage ? (
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code d'émargement" 
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-40 h-40 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-500">Génération...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Expire dans {formatTime(timeRemaining)}
                </span>
              </div>

              <Progress value={progressPercentage} className="h-2" />
            </CardContent>
          </Card>

          {/* Code numérique */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Code numérique
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {showCode ? (
                <div className="text-4xl font-mono font-bold tracking-widest text-primary">
                  {currentCode || '------'}
                </div>
              ) : (
                <div className="text-4xl font-mono font-bold tracking-widest text-muted-foreground">
                  ••••••
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Les étudiants peuvent saisir ce code pour s'émarger
              </p>
            </CardContent>
          </Card>

          {/* Statistiques temps réel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Émargement en temps réel
                <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  En direct
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Étudiants émargés:</span>
                <Badge variant="secondary">
                  {signedCount}/{totalStudents} ({attendanceRate}%)
                </Badge>
              </div>
              
              <Progress value={attendanceRate} className="h-3" />
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{signedCount}</div>
                  <div className="text-xs text-muted-foreground">Présents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{totalStudents - signedCount}</div>
                  <div className="text-xs text-muted-foreground">En attente</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={generateNewCode}
              disabled={isRegenerating}
              className="flex-1"
            >
              {isRegenerating ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Nouveau code
            </Button>
            <Button onClick={onClose} className="flex-1">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplayModal;