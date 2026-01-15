import React from 'react';
import { Camera, Mic, AlertCircle, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MediaPermissionDialogProps {
  isOpen: boolean;
  onRequestPermission: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MediaPermissionDialog: React.FC<MediaPermissionDialogProps> = ({
  isOpen,
  onRequestPermission,
  onCancel,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Autorisation requise
          </DialogTitle>
          <DialogDescription>
            Cette classe virtuelle nécessite l'accès à votre caméra et microphone pour participer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Accès à la caméra</h4>
                    <p className="text-sm text-muted-foreground">
                      Pour que les autres participants puissent vous voir
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">Accès au microphone</h4>
                    <p className="text-sm text-muted-foreground">
                      Pour communiquer avec les autres participants
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Vos données sont sécurisées</p>
                <p>
                  Nous ne stockons aucune vidéo ou audio. La communication se fait directement 
                  entre les participants.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={onRequestPermission}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Demande d'autorisation..." : "Autoriser l'accès"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPermissionDialog;