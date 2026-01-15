import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Send, Clock, Users, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SendSignatureLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onSuccess: () => void;
}

const SendSignatureLinkModal: React.FC<SendSignatureLinkModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attendanceSheet) {
      loadStudents();
      
      // Si un token existe déjà, afficher le lien
      if (attendanceSheet.signature_link_token) {
        const link = `${window.location.origin}/emargement/signer/${attendanceSheet.signature_link_token}`;
        setGeneratedLink(link);
        setExpiresAt(attendanceSheet.signature_link_expires_at || null);
      }
    }
  }, [isOpen, attendanceSheet]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('user_formation_assignments')
        .select(`
          user_id,
          users!inner(id, first_name, last_name, email)
        `)
        .eq('formation_id', attendanceSheet.formation_id);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleGenerateAndSend = async () => {
    try {
      setLoading(true);

      // Générer le token
      const { token, expiresAt: expiry } = await attendanceService.generateSignatureToken(attendanceSheet.id);
      
      const link = `${window.location.origin}/emargement/signer/${token}`;
      setGeneratedLink(link);
      setExpiresAt(expiry);

      // Récupérer les IDs des étudiants
      const studentIds = students.map(s => s.users.id);

      // Envoyer le lien aux étudiants
      await attendanceService.sendSignatureLink(attendanceSheet.id, studentIds);

      toast.success(`Lien envoyé à ${studentIds.length} étudiants`);
      onSuccess();
    } catch (error: any) {
      console.error('Error generating link:', error);
      toast.error('Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Envoyer le lien d'émargement</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de la session */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">{attendanceSheet.formations?.title}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(attendanceSheet.date), 'PPP', { locale: fr })} • {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}
            </p>
            {attendanceSheet.session_type === 'autonomie' && (
              <div className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                Session en autonomie
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Étudiants</p>
              </div>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Validité</p>
              </div>
              <p className="text-2xl font-bold">24h</p>
            </div>
          </div>

          {/* Lien généré */}
          {generatedLink && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Lien d'émargement</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-muted text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expire le {format(new Date(expiresAt), 'PPP à HH:mm', { locale: fr })}
                </p>
              )}
            </div>
          )}

          {/* Informations */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
            <p className="text-blue-600 dark:text-blue-400">
              <strong>Important :</strong> Le lien sera envoyé à tous les étudiants de la formation via une notification 
              dans l'application. Ils auront 24 heures pour signer. Une fois que tous les étudiants auront signé ou 
              que le délai sera expiré, la feuille sera automatiquement envoyée pour validation administrative.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {!generatedLink && (
              <Button onClick={handleGenerateAndSend} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Générer et envoyer
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendSignatureLinkModal;
