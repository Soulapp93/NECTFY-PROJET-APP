import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  X, 
  CheckCircle, 
  Users, 
  Clock,
  Loader2,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { VirtualClass } from '@/services/virtualClassService';

interface LiveAttendanceMenuProps {
  virtualClass: VirtualClass;
  isInstructor: boolean;
  onClose: () => void;
}

const LiveAttendanceMenu: React.FC<LiveAttendanceMenuProps> = ({
  virtualClass,
  isInstructor,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [attendanceSheet, setAttendanceSheet] = useState<any>(null);
  const [signedCount, setSignedCount] = useState(0);

  // Find or create attendance sheet for this virtual class
  const handleGenerateQRCode = async () => {
    setIsLoading(true);
    
    try {
      // Check if there's already an attendance sheet for today and this virtual class
      // We need to find the schedule_slot linked to this virtual class
      const db = supabase as any;
      
      // Look for an attendance sheet for today's date and the formation
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: existingSheet } = await db
        .from('attendance_sheets')
        .select('*')
        .eq('formation_id', virtualClass.formation_id)
        .eq('date', today)
        .eq('session_type', 'distanciel')
        .maybeSingle();

      let sheet = existingSheet;

      if (!sheet) {
        // We need to create an attendance sheet for this virtual class
        // First, check if there's a schedule slot for this
        const { data: scheduleSlots } = await db
          .from('schedule_slots')
          .select(`
            *,
            schedule:schedules!inner(formation_id)
          `)
          .eq('schedule.formation_id', virtualClass.formation_id)
          .eq('date', today);

        const matchingSlot = scheduleSlots?.find((slot: any) => 
          slot.start_time === virtualClass.start_time && 
          slot.session_type === 'distanciel'
        );

        if (!matchingSlot) {
          toast.error("Aucun créneau d'emploi du temps trouvé pour cette classe virtuelle aujourd'hui");
          setIsLoading(false);
          return;
        }

        // Create attendance sheet
        const { data: newSheet, error: createError } = await db
          .from('attendance_sheets')
          .insert({
            formation_id: virtualClass.formation_id,
            schedule_slot_id: matchingSlot.id,
            date: today,
            start_time: virtualClass.start_time,
            end_time: virtualClass.end_time,
            title: `Classe virtuelle - ${virtualClass.title}`,
            instructor_id: virtualClass.instructor_id,
            session_type: 'distanciel',
            is_open_for_signing: true,
            status: 'En cours',
          })
          .select()
          .single();

        if (createError) throw createError;
        sheet = newSheet;
      } else {
        // Open the existing sheet for signing
        await db
          .from('attendance_sheets')
          .update({ is_open_for_signing: true, status: 'En cours' })
          .eq('id', sheet.id);
      }

      // Generate token for signature
      const { data: token, error: tokenError } = await supabase
        .rpc('generate_signature_token', { sheet_id: sheet.id });

      if (tokenError) throw tokenError;

      // Generate QR code with signature URL
      const signatureUrl = `${window.location.origin}/signature/${token}`;
      const qrDataUrl = await QRCode.toDataURL(signatureUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#8B5CF6', light: '#FFFFFF' },
      });

      setQrCodeUrl(qrDataUrl);
      setAttendanceSheet(sheet);

      // Get count of signatures
      const { count } = await db
        .from('attendance_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('attendance_sheet_id', sheet.id)
        .eq('present', true);

      setSignedCount(count || 0);

      toast.success('QR Code généré avec succès');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error("Erreur lors de la génération du QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAttendance = async () => {
    if (!attendanceSheet) return;
    
    try {
      const db = supabase as any;
      await db
        .from('attendance_sheets')
        .update({ 
          is_open_for_signing: false, 
          closed_at: new Date().toISOString(),
          status: 'Complété'
        })
        .eq('id', attendanceSheet.id);

      toast.success('Émargement clôturé');
      setQrCodeUrl(null);
      setAttendanceSheet(null);
    } catch (error) {
      console.error('Error closing attendance:', error);
      toast.error("Erreur lors de la clôture");
    }
  };

  if (!isInstructor) {
    return (
      <Card className="absolute top-20 right-4 w-80 z-50 shadow-2xl border-purple-500/20 bg-background/95 backdrop-blur-xl">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground">
            Seul le formateur peut gérer l'émargement
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="absolute top-20 right-4 w-96 z-50 shadow-2xl border-purple-500/20 bg-background/95 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Émargement Live</CardTitle>
              <CardDescription className="text-xs">
                Classe virtuelle en cours
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!qrCodeUrl ? (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
              <QrCode className="h-10 w-10 text-violet-500" />
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">
                Générez un QR code pour permettre aux étudiants de signer leur présence
              </p>
            </div>
            
            <Button 
              onClick={handleGenerateQRCode}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Générer le QR Code
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="relative bg-white rounded-xl p-4 flex items-center justify-center">
              <img 
                src={qrCodeUrl} 
                alt="QR Code Émargement" 
                className="w-full max-w-[250px] h-auto"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-violet-500" />
                <span className="font-medium">{signedCount}</span>
                <span className="text-muted-foreground">signés</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">
                  {format(new Date(), 'HH:mm', { locale: fr })}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Les étudiants peuvent scanner ce QR code pour signer leur présence
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleGenerateQRCode}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleCloseAttendance}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Clôturer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveAttendanceMenu;
