import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Users, GraduationCap, UserCheck, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Comptes de démo pour les tests
const DEMO_ACCOUNTS = [
  { 
    role: 'Admin Principal', 
    email: 'admin.principal@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: Shield,
  },
  { 
    role: 'Administrateur', 
    email: 'admin@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: Users,
  },
  { 
    role: 'Formateur', 
    email: 'formateur@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: Briefcase,
  },
  { 
    role: 'Étudiant', 
    email: 'etudiant@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: GraduationCap,
  },
  { 
    role: 'Tuteur', 
    email: 'tuteur@demo.nectfy.fr', 
    password: 'Demo123!',
    icon: UserCheck,
  },
];

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [demoReady, setDemoReady] = useState(false);
  const [settingUpDemo, setSettingUpDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Initialize demo accounts on first load
  useEffect(() => {
    const initDemoAccounts = async () => {
      try {
        const { data: demoCheck } = await supabase
          .from('establishments')
          .select('id')
          .eq('email', 'demo@nectfy.fr')
          .maybeSingle();

        if (demoCheck) {
          setDemoReady(true);
          return;
        }

        setSettingUpDemo(true);
        const { data, error } = await supabase.functions.invoke('setup-demo-accounts');
        
        if (error) {
          console.error('Demo setup error:', error);
        } else {
          console.log('Demo accounts setup:', data);
          setDemoReady(true);
        }
      } catch (err) {
        console.error('Error checking demo accounts:', err);
      } finally {
        setSettingUpDemo(false);
      }
    };

    initDemoAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Adresse email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter');
        } else {
          setError('Erreur de connexion. Veuillez réessayer.');
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        toast.success('Connexion réussie !');
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setError('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, password: string, role: string) => {
    setLoadingDemo(role);
    setError(null);
    
    try {
      if (!demoReady) {
        toast.loading('Préparation des comptes démo...');
        const { error: setupError } = await supabase.functions.invoke('setup-demo-accounts');
        if (setupError) {
          toast.dismiss();
          toast.error('Erreur lors de la préparation des comptes démo');
          setLoadingDemo(null);
          return;
        }
        toast.dismiss();
        setDemoReady(true);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.loading('Configuration du compte démo...');
        await supabase.functions.invoke('setup-demo-accounts');
        toast.dismiss();
        
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (retryError) {
          toast.error(`Impossible de se connecter en tant que ${role}. Veuillez réessayer.`);
          setLoadingDemo(null);
          return;
        }

        if (retryData.user) {
          toast.success(`Connexion réussie en tant que ${role} !`);
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
          } else {
            window.location.href = '/dashboard';
          }
        }
        return;
      }

      if (data.user) {
        toast.success(`Connexion réussie en tant que ${role} !`);
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          window.location.href = redirectUrl;
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      toast.error('Erreur lors de la connexion démo');
    } finally {
      setLoadingDemo(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen nect-gradient relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/3 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Logo and brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4 animate-float">
            <span className="text-primary font-bold text-2xl">NF</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">NECTFORMA</h1>
          <p className="text-white/70 text-sm">Plateforme de gestion éducative</p>
        </div>

        {/* Login form card */}
        <div className="bg-white rounded-2xl border-2 border-primary/30 shadow-2xl p-6 sm:p-8 backdrop-blur-sm animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Connexion
            </h2>
            <p className="text-muted-foreground text-sm">
              Accédez à votre espace NECTFORMA
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-xl text-sm mb-4 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                <Mail className="inline h-4 w-4 mr-2 text-primary" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border-2 border-primary/20 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-foreground placeholder:text-muted-foreground/60"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                <Lock className="inline h-4 w-4 mr-2 text-primary" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-primary/20 rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 pr-12 text-foreground placeholder:text-muted-foreground/60"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="rounded border-primary/30 text-primary focus:ring-primary h-4 w-4" />
                <span className="ml-2 text-sm text-muted-foreground">Se souvenir de moi</span>
              </label>
              <a href="#" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Demo Accounts Section */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-center mb-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Comptes de démonstration
              </span>
              {settingUpDemo && (
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Préparation...
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                const isLoading = loadingDemo === account.role;
                return (
                  <button
                    key={account.role}
                    onClick={() => handleDemoLogin(account.email, account.password, account.role)}
                    disabled={loadingDemo !== null || settingUpDemo}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 border-2 border-primary/20 rounded-xl transition-all duration-200 hover:border-primary hover:bg-primary/5 disabled:opacity-50 group"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <span className="font-medium text-xs text-foreground/80 group-hover:text-primary transition-colors text-center leading-tight">
                      {account.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create establishment link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-muted-foreground text-sm mb-3">
              Pas encore de compte établissement ?
            </p>
            <Link 
              to="/create-establishment" 
              className="inline-flex items-center justify-center w-full bg-secondary text-secondary-foreground py-3 px-4 rounded-xl font-medium hover:bg-secondary/80 transition-all duration-200"
            >
              Créer un établissement
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/50 text-xs">
          © {new Date().getFullYear()} NECTFORMA. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default Auth;
