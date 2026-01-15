import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, QrCode, Check, AlertCircle, Camera, User, Calendar, Clock, Hash, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import QrScanner from 'qr-scanner';

interface QRAttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionInfo {
  sheetId: string;
  formationTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  instructorName: string;
  room: string;
}

type ScanStep = 'scanning' | 'validating' | 'confirmed' | 'error';

const QRAttendanceScannerModal: React.FC<QRAttendanceScannerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userId } = useCurrentUser();
  const [step, setStep] = useState<ScanStep>('scanning');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Camera states
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  // Load user info and signature on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return;
      
      try {
        // Load user info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();
          
        if (userData) {
          setUserName(`${userData.first_name} ${userData.last_name}`);
        }

        // Load user signature
        const { data: signatureData } = await supabase
          .from('user_signatures')
          .select('signature_data')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (signatureData?.signature_data) {
          setUserSignature(signatureData.signature_data);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    if (isOpen) {
      loadUserData();
      setStep('scanning');
      setSessionInfo(null);
      setErrorMessage('');
    }
  }, [isOpen, userId]);

  // Initialize camera when modal opens
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (mounted && isOpen && step === 'scanning' && videoRef.current) {
        startCamera();
      }
    };

    if (isOpen && step === 'scanning') {
      initCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    try {
      if (!videoRef.current) return;
      
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setHasPermission(false);
        toast.error('Aucune caméra détectée');
        return;
      }

      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleQRCodeScanned(result.data),
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scannerRef.current.start();
      setHasPermission(true);
    } catch (error) {
      console.error('Camera error:', error);
      setHasPermission(false);
      toast.error('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  };

  const handleQRCodeScanned = useCallback(async (qrData: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    stopCamera();
    setStep('validating');

    try {
      // Parse QR code - expecting format: URL with code parameter or just 6-digit code
      let code = '';
      
      try {
        const url = new URL(qrData);
        code = url.searchParams.get('code') || '';
      } catch {
        // If not a URL, check if it's a 6-digit code directly
        if (/^\d{6}$/.test(qrData)) {
          code = qrData;
        }
      }

      if (!code || !/^\d{6}$/.test(code)) {
        throw new Error('QR Code invalide');
      }

      // Validate QR code and get session info
      const { data: validationResult, error: validationError } = await supabase.rpc(
        'validate_qr_code_secure',
        { code_param: code, user_id_param: userId }
      );

      if (validationError) throw validationError;

      const result = validationResult?.[0];
      if (!result?.is_valid) {
        throw new Error(result?.error_message || 'Session invalide');
      }

      // Get full session details using a simpler query that works with RLS
      const { data: sheetData, error: sheetError } = await supabase
        .from('attendance_sheets')
        .select(`
          id,
          date,
          start_time,
          end_time,
          room,
          formation_id,
          instructor_id
        `)
        .eq('id', result.sheet_id)
        .maybeSingle();

      if (sheetError || !sheetData) {
        console.error('Sheet fetch error:', sheetError);
        throw new Error('Session non trouvée ou accès refusé');
      }

      // Get formation details separately
      const { data: formationData } = await supabase
        .from('formations')
        .select('id, title')
        .eq('id', sheetData.formation_id)
        .maybeSingle();

      // Get instructor details separately if instructor_id exists
      let instructorName = 'Non assigné';
      if (sheetData.instructor_id) {
        const { data: instructorData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', sheetData.instructor_id)
          .maybeSingle();
        
        if (instructorData) {
          instructorName = `${instructorData.first_name} ${instructorData.last_name}`;
        }
      }

      const formationId = formationData?.id || sheetData.formation_id;

      // Check if user is enrolled in the formation
      const { data: enrollment } = await supabase
        .from('user_formation_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('formation_id', formationId)
        .maybeSingle();

      if (!enrollment) {
        throw new Error('Vous n\'êtes pas inscrit à cette formation');
      }

      // Check if already signed
      const { data: existingSignature } = await supabase
        .from('attendance_signatures')
        .select('id')
        .eq('attendance_sheet_id', result.sheet_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingSignature) {
        throw new Error('Vous avez déjà émargé pour cette session');
      }

      setSessionInfo({
        sheetId: result.sheet_id,
        formationTitle: result.formation_title || formationData?.title || 'Formation',
        date: sheetData.date,
        startTime: sheetData.start_time?.slice(0, 5) || '',
        endTime: sheetData.end_time?.slice(0, 5) || '',
        instructorName: instructorName,
        room: sheetData.room || 'Non définie'
      });

      setStep('confirmed');
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur de validation');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  }, [userId, isProcessing]);

  const handleValidatePresence = async () => {
    if (!sessionInfo || !userId) return;
    setIsProcessing(true);

    try {
      // Create attendance signature with user's stored signature
      const { error: signatureError } = await supabase
        .from('attendance_signatures')
        .insert({
          attendance_sheet_id: sessionInfo.sheetId,
          user_id: userId,
          user_type: 'student',
          present: true,
          signature_data: userSignature,
          signed_at: new Date().toISOString()
        });

      if (signatureError) throw signatureError;

      // Log the action
      await supabase.rpc('log_attendance_action', {
        sheet_id: sessionInfo.sheetId,
        user_id: userId,
        action_type: 'qr_scan',
        user_agent_val: navigator.userAgent,
        meta: JSON.stringify({ auto_sign: true, has_signature: !!userSignature })
      });

      toast.success('Présence validée avec succès !');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la validation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep('scanning');
    setErrorMessage('');
    setSessionInfo(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6" />
              Émargement par QR Code
            </DialogTitle>
          </DialogHeader>
          {userName && (
            <p className="text-center text-sm mt-2 opacity-90">
              <User className="inline h-4 w-4 mr-1" />
              {userName}
            </p>
          )}
        </div>

        <div className="p-6">
          {/* Scanning Step */}
          {step === 'scanning' && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-black rounded-xl overflow-hidden">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  playsInline
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/50 rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  </div>
                  <div className="absolute inset-8 flex items-center justify-center">
                    <ScanLine className="h-24 w-24 text-primary animate-pulse" />
                  </div>
                </div>

                {hasPermission === false && (
                  <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center text-center p-4">
                    <Camera className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">Accès caméra requis</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Autorisez l'accès à la caméra pour scanner
                    </p>
                    <Button onClick={startCamera} className="mt-4" size="sm">
                      Réessayer
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Pointez la caméra vers le QR code affiché par votre formateur
              </p>

              {!userSignature && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-3 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Signature manquante :</strong> Enregistrez votre signature dans votre profil pour un émargement automatique complet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Validating Step */}
          {step === 'validating' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
              <div>
                <p className="font-medium text-lg">Validation en cours...</p>
                <p className="text-sm text-muted-foreground">Vérification de votre identité et de la session</p>
              </div>
            </div>
          )}

          {/* Confirmed Step */}
          {step === 'confirmed' && sessionInfo && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg">Session identifiée !</h3>
                <p className="text-sm text-muted-foreground">Vérifiez les informations et validez</p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Formation</p>
                      <p className="font-medium text-sm">{sessionInfo.formationTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium text-sm capitalize">{formatDate(sessionInfo.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horaires</p>
                      <p className="font-medium text-sm">{sessionInfo.startTime} - {sessionInfo.endTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Formateur</p>
                      <p className="font-medium text-sm">{sessionInfo.instructorName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signature preview */}
              {userSignature && (
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Votre signature :</p>
                  <img 
                    src={userSignature} 
                    alt="Signature" 
                    className="max-h-16 mx-auto object-contain"
                  />
                </div>
              )}

              <Button 
                onClick={handleValidatePresence} 
                disabled={isProcessing}
                className="w-full h-12 text-base font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Valider ma présence
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Erreur de validation</h3>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Fermer
                </Button>
                <Button onClick={handleRetry} className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRAttendanceScannerModal;
