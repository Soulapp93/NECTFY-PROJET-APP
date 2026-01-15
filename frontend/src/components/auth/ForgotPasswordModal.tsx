import React, { useState } from 'react';
import { Mail, Loader2, AlertCircle, CheckCircle, Send, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ModalState = 'form' | 'success' | 'needs_activation';

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingActivation, setResendingActivation] = useState(false);
  const [state, setState] = useState<ModalState>('form');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email,
          redirectUrl: `${window.location.origin}/reset-password`,
        },
      });

      if (fnError) {
        // Parse the error response
        let errorData;
        try {
          errorData = JSON.parse(fnError.message);
        } catch {
          errorData = { error: fnError.message };
        }

        if (errorData.action === 'resend_invitation') {
          setState('needs_activation');
        } else {
          setError(errorData.error || errorData.message || 'Une erreur est survenue');
        }
        return;
      }

      // Check if the response indicates needs activation
      if (data?.action === 'resend_invitation') {
        setState('needs_activation');
        return;
      }

      setState('success');
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Try to parse error from edge function response
      if (err?.context?.body) {
        try {
          const bodyText = await err.context.body.text?.();
          const parsed = JSON.parse(bodyText || '{}');
          if (parsed.action === 'resend_invitation') {
            setState('needs_activation');
            return;
          }
          setError(parsed.error || parsed.message || 'Une erreur est survenue');
          return;
        } catch {
          // Continue with generic error
        }
      }
      
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async () => {
    setResendingActivation(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke('resend-invitation-native', {
        body: { email },
      });

      if (fnError) {
        setError('Impossible de renvoyer l\'invitation. Contactez votre administrateur.');
        return;
      }

      toast.success('Invitation d\'activation renvoyée !');
      onOpenChange(false);
      resetModal();
    } catch (err) {
      console.error('Resend activation error:', err);
      setError('Une erreur est survenue. Veuillez contacter votre administrateur.');
    } finally {
      setResendingActivation(false);
    }
  };

  const resetModal = () => {
    setEmail('');
    setState('form');
    setError(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {state === 'form' && 'Mot de passe oublié'}
            {state === 'success' && 'Email envoyé !'}
            {state === 'needs_activation' && 'Compte non activé'}
          </DialogTitle>
        </DialogHeader>

        {state === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Entrez votre adresse email pour recevoir un lien de réinitialisation.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !email}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer le lien
                </>
              )}
            </Button>
          </form>
        )}

        {state === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Un email de réinitialisation a été envoyé à
              </p>
              <p className="font-medium">{email}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Vérifiez également votre dossier spam si vous ne le trouvez pas.
            </p>
            <Button variant="outline" onClick={() => handleClose(false)} className="w-full">
              Fermer
            </Button>
          </div>
        )}

        {state === 'needs_activation' && (
          <div className="space-y-4 py-2">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Ce compte n'a pas encore été activé.
              </p>
              <p className="text-sm text-muted-foreground">
                Vous devez d'abord activer votre compte avant de pouvoir réinitialiser votre mot de passe.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={handleResendActivation} 
                className="w-full"
                disabled={resendingActivation}
              >
                {resendingActivation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Renvoyer l'invitation d'activation
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleClose(false)} 
                className="w-full"
              >
                Annuler
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Si le problème persiste, contactez votre administrateur.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
