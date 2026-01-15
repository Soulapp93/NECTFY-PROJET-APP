import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Scan, Flashlight, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQRCodeScanned: (qrData: string) => void;
}

const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onQRCodeScanned
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simuler la demande de permission caméra
  const requestCameraPermission = async () => {
    try {
      setHasPermission(null);
      // Simulation d'un délai de permission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasPermission(true);
      startCamera();
    } catch (error) {
      setHasPermission(false);
      toast.error('Accès à la caméra refusé');
    }
  };

  // Simuler le démarrage de la caméra
  const startCamera = async () => {
    setIsScanning(true);
    // Dans un vrai projet, ici on utiliserait getUserMedia()
    toast.success('Caméra activée - Approchez le QR code');
  };

  // Simuler l'arrêt de la caméra
  const stopCamera = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Simuler la détection d'un QR code
  const simulateQRDetection = () => {
    const mockQRData = `attendance:${Date.now()}:demo-token`;
    onQRCodeScanned(mockQRData);
    toast.success('QR Code détecté !');
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const toggleFlashlight = () => {
    setFlashlightOn(!flashlightOn);
    toast.info(flashlightOn ? 'Flash désactivé' : 'Flash activé');
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setHasPermission(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scanner le QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasPermission === null && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Accès à la caméra requis</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Autorisez l'accès à la caméra pour scanner le QR code d'émargement
                  </p>
                </div>
                <Button onClick={requestCameraPermission} className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Activer la caméra
                </Button>
              </CardContent>
            </Card>
          )}

          {hasPermission === false && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <X className="w-12 h-12 mx-auto text-destructive" />
                <div>
                  <h3 className="font-medium text-destructive">Accès refusé</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur
                  </p>
                </div>
                <Button variant="outline" onClick={requestCameraPermission}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          )}

          {hasPermission === true && (
            <div className="space-y-4">
              {/* Zone de caméra simulée */}
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {isScanning ? (
                    <div className="text-white text-center space-y-2">
                      <Scan className="w-16 h-16 mx-auto animate-pulse" />
                      <p className="text-sm">Recherche de QR code...</p>
                    </div>
                  ) : (
                    <div className="text-white text-center space-y-2">
                      <Camera className="w-16 h-16 mx-auto" />
                      <p className="text-sm">Caméra en attente</p>
                    </div>
                  )}
                </div>
                
                {/* Overlay de scan */}
                <div className="absolute inset-4 border-2 border-white rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                </div>
              </div>

              {/* Contrôles */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFlashlight}
                  className={flashlightOn ? 'bg-yellow-100 border-yellow-300' : ''}
                >
                  <Flashlight className={`w-4 h-4 ${flashlightOn ? 'text-yellow-600' : ''}`} />
                </Button>
                <Button onClick={simulateQRDetection} className="flex-1">
                  <Scan className="w-4 h-4 mr-2" />
                  Simuler détection QR
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Approchez le QR code affiché par votre formateur
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeScannerModal;