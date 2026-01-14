import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, Building2, User, Lock, Shield } from 'lucide-react';

const passwordSchema = z.string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

interface ActivationDetails {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  establishment_name: string;
  is_valid: boolean;
  error_message: string | null;
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'Admin': 'Administrateur',
    'AdminPrincipal': 'Administrateur Principal',
    'Formateur': 'Formateur',
    'Étudiant': 'Étudiant',
  };
  return labels[role] || role;
};

export default function Activation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activation, setActivation] = useState<ActivationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirm_password: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });

  useEffect(() => {
    if (!token) {
      setError("Token d'activation manquant");
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      // Validate token by checking user_activation_tokens table
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_activation_tokens')
        .select(`
          *,
          users!inner(
            id,
            email,
            first_name,
            last_name,
            role,
            establishment_id,
            establishments!inner(name)
          )
        `)
        .eq('token', token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        setError("Token d'activation invalide ou expiré");
        return;
      }

      const user = tokenData.users as any;
      
      setActivation({
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        establishment_name: user.establishments?.name || 'NECTFORMA',
        is_valid: true,
        error_message: null
      });
    } catch (err: any) {
      setError("Erreur lors de la validation du token");
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { min: 0, label: 'Très faible', color: 'bg-destructive' },
      { min: 2, label: 'Faible', color: 'bg-orange-500' },
      { min: 3, label: 'Moyen', color: 'bg-yellow-500' },
      { min: 4, label: 'Fort', color: 'bg-emerald-500' },
      { min: 5, label: 'Très fort', color: 'bg-green-600' }
    ];

    const level = [...levels].reverse().find(l => score >= l.min) || levels[0];
    setPasswordStrength({ score, label: level.label, color: level.color });
  };

  const handlePasswordChange = (value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    calculatePasswordStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    try {
      passwordSchema.parse(formData.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    if (formData.password !== formData.confirm_password) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setSubmitting(true);

    try {
      const response = await supabase.functions.invoke('activate-user-account', {
        body: {
          token,
          password: formData.password
        }
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success("Compte activé avec succès !");

      // Auto-login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: activation!.email,
        password: formData.password
      });

      if (signInError) {
        toast.info("Veuillez vous connecter avec vos identifiants");
        navigate('/auth');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'activation du compte");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification du lien d'activation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Lien d'activation invalide</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Le lien d'activation a peut-être expiré ou a déjà été utilisé.
              Contactez votre administrateur pour recevoir un nouveau lien.
            </p>
            <Button onClick={() => navigate('/auth')} variant="outline">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            NECTFORMA
          </h1>
          <p className="text-muted-foreground mt-2">Plateforme de gestion de formation</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Activez votre compte</CardTitle>
            <CardDescription>
              Créez votre mot de passe pour accéder à votre espace {activation?.establishment_name}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="font-medium">{activation?.first_name} {activation?.last_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Établissement</p>
                  <p className="font-medium">{activation?.establishment_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rôle</p>
                  <p className="font-medium">{getRoleLabel(activation?.role || '')}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={activation?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            passwordStrength.score >= level ? passwordStrength.color : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Force : {passwordStrength.label}
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Au moins 8 caractères, une majuscule, une minuscule et un chiffre
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.confirm_password && formData.password !== formData.confirm_password && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Activation en cours...
                  </>
                ) : (
                  "Activer mon compte"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Déjà activé ?{' '}
          <button
            onClick={() => navigate('/auth')}
            className="text-primary hover:underline font-medium"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
