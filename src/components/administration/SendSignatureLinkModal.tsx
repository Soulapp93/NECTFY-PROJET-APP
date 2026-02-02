import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { attendanceService, AttendanceSheet } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Send, Clock, Users, CheckCircle2, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface SendSignatureLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceSheet: AttendanceSheet;
  onSuccess: () => void;
}

interface Student {
  user_id: string;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface DeliveryRow {
  student_id: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  last_error?: string | null;
  last_attempt_at?: string | null;
}

const SendSignatureLinkModal: React.FC<SendSignatureLinkModalProps> = ({
  isOpen,
  onClose,
  attendanceSheet,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [linkAlreadySent, setLinkAlreadySent] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  useEffect(() => {
    if (isOpen && attendanceSheet) {
      loadStudents();
      loadDeliveries();
      
      // Si un token existe déjà, afficher le lien
      if (attendanceSheet.signature_link_token) {
        // Use current origin so link works in preview AND production
        const link = `${window.location.origin}/emargement/signer/${attendanceSheet.signature_link_token}`;
        setGeneratedLink(link);
        setExpiresAt(attendanceSheet.signature_link_expires_at || null);
        setLinkAlreadySent(!!attendanceSheet.signature_link_sent_at);
      } else {
        setGeneratedLink(null);
        setExpiresAt(null);
        setLinkAlreadySent(false);
      }
    }
  }, [isOpen, attendanceSheet]);

  const loadDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const rows = await attendanceService.getAttendanceLinkDeliveries(attendanceSheet.id);
      setDeliveries(rows as DeliveryRow[]);
    } catch (e) {
      // journal optionnel, ne pas bloquer l'UI
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const { data, error } = await supabase
        .from('user_formation_assignments')
        .select(`
          user_id,
          users!inner(id, first_name, last_name, email, role)
        `)
        .eq('formation_id', attendanceSheet.formation_id);

      if (error) throw error;
      
      // Filtrer uniquement les étudiants
      const studentData = (data || []).filter(
        (item: any) => item.users?.role === 'Étudiant'
      ) as Student[];
      
      setStudents(studentData);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleGenerateAndSend = async () => {
    if (students.length === 0) {
      toast.error('Aucun étudiant à notifier');
      return;
    }

    try {
      setLoading(true);

      // Générer le token
      const { token, expiresAt: expiry } = await attendanceService.generateSignatureToken(attendanceSheet.id);
      
      const link = `${window.location.origin}/emargement/signer/${token}`;
      setGeneratedLink(link);
      setExpiresAt(expiry);

      // Récupérer les IDs des étudiants
      const studentIds = students.map(s => s.users.id);

      // Envoyer le lien aux étudiants via la messagerie interne
      await attendanceService.sendSignatureLink(attendanceSheet.id, studentIds);

      setLinkAlreadySent(true);
      toast.success(`Lien envoyé à ${studentIds.length} étudiants via la messagerie interne`);
      onSuccess();
    } catch (error: any) {
      console.error('Error generating and sending link:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  const handleFallbackSend = async (retryFailedOnly = false) => {
    if (students.length === 0) {
      toast.error('Aucun étudiant à notifier');
      return;
    }

    try {
      setLoading(true);

      const studentIds = students.map((s) => s.users.id);
      const res = await attendanceService.sendSignatureLinkFallback(attendanceSheet.id, studentIds, { retryFailedOnly });

      if (res?.signatureLink) {
        setGeneratedLink(res.signatureLink);
      }
      if (res?.expiresAt) {
        setExpiresAt(res.expiresAt);
      }

      await loadDeliveries();

      const failed = (res?.delivered || []).filter((d) => d.status === 'failed').length;
      if (failed > 0) {
        toast.error(`${failed} envoi(s) en échec (fallback) — voir le journal`);
      } else {
        toast.success('Envoi fallback terminé');
      }
    } catch (error: any) {
      console.error('Error fallback sending link:', error);
      toast.error(error.message || "Erreur lors de l'envoi (fallback)");
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

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const signedCount = attendanceSheet.signatures?.filter(
    (sig: any) => sig.user_type === 'student' && sig.present
  )?.length || 0;

  const getStudentLabel = (id: string) => {
    const s = students.find((st) => st.users.id === id);
    return s ? `${s.users.first_name} ${s.users.last_name} (${s.users.email})` : id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Envoyer le lien d'émargement
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Informations de la session */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{attendanceSheet.formations?.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(attendanceSheet.date), 'EEEE d MMMM yyyy', { locale: fr })} • {attendanceSheet.start_time.substring(0, 5)} - {attendanceSheet.end_time.substring(0, 5)}
            </p>
            {attendanceSheet.room && (
              <p className="text-sm text-muted-foreground">Salle: {attendanceSheet.room}</p>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Étudiants</p>
              </div>
              <p className="text-2xl font-bold">
                {loadingStudents ? '...' : students.length}
              </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Signés</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{signedCount}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Validité</p>
              </div>
              <p className="text-2xl font-bold">24h</p>
            </div>
          </div>

          {/* Liste des étudiants */}
          {!loadingStudents && students.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Étudiants qui recevront le lien :</p>
              <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
                <ul className="space-y-1">
                  {students.map((student) => (
                    <li key={student.user_id} className="text-sm flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      {student.users.first_name} {student.users.last_name}
                      <span className="text-muted-foreground">({student.users.email})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Lien généré */}
          {generatedLink && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Lien d'émargement</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-muted text-sm font-mono"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {expiresAt && (
                <p className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {isExpired 
                    ? `Expiré le ${format(new Date(expiresAt), 'PPP à HH:mm', { locale: fr })}`
                    : `Expire le ${format(new Date(expiresAt), 'PPP à HH:mm', { locale: fr })}`
                  }
                </p>
              )}
            </div>
          )}

          {/* Statut d'envoi */}
          {linkAlreadySent && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm flex items-start gap-3">
              <Mail className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-700 dark:text-green-400 font-medium">Lien envoyé</p>
                <p className="text-green-600 dark:text-green-500">
                  Les étudiants ont reçu un message dans leur espace NECTFORMA avec un bouton "Valider ma présence".
                </p>
              </div>
            </div>
          )}

          {/* Informations */}
          {!linkAlreadySent && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-700 dark:text-blue-400 font-medium mb-1">
                    Comment ça fonctionne ?
                  </p>
                  <ul className="text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>Un message sera envoyé à chaque étudiant dans leur messagerie</li>
                    <li>Ils auront un bouton "Valider ma présence" pour signer</li>
                    <li>Leur signature enregistrée sera utilisée ou ils pourront signer</li>
                    <li>Le lien est valide pendant 24 heures</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Journal fallback */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Journal d'envoi (fallback)</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDeliveries}
                disabled={loadingDeliveries}
              >
                Actualiser
              </Button>
            </div>
            {loadingDeliveries ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun envoi fallback enregistré pour cette session.
              </p>
            ) : (
              <div className="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {deliveries.map((d) => (
                    <li key={d.student_id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{getStudentLabel(d.student_id)}</p>
                        {d.status === 'failed' && d.last_error && (
                          <p className="text-xs text-destructive truncate">{d.last_error}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Tentatives: {d.attempts}
                          {d.last_attempt_at ? ` • ${format(new Date(d.last_attempt_at), 'Pp', { locale: fr })}` : ''}
                        </p>
                      </div>
                      <Badge
                        variant={d.status === 'sent' ? 'default' : d.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {d.status === 'sent' ? 'Envoyé' : d.status === 'failed' ? 'Échec' : 'En cours'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleFallbackSend(false)}
            disabled={loading || loadingStudents || students.length === 0}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                Fallback…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoi fallback
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleFallbackSend(true)}
            disabled={loading || loadingStudents || students.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Retry échecs
          </Button>
          {!linkAlreadySent && (
            <Button 
              onClick={handleGenerateAndSend} 
              disabled={loading || loadingStudents || students.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {generatedLink ? 'Renvoyer le lien' : 'Générer et envoyer'}
                </>
              )}
            </Button>
          )}
          {linkAlreadySent && !isExpired && (
            <Button 
              onClick={handleGenerateAndSend} 
              disabled={loading || loadingStudents}
              variant="secondary"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Renvoyer le lien
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendSignatureLinkModal;
