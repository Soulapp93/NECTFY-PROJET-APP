
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { SidebarProvider } from '@/components/ui/sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import MobileHeader from './components/MobileHeader';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminPrincipalRoute from './components/AdminPrincipalRoute';
import TutorRestrictedRoute from './components/TutorRestrictedRoute';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { monitoring } from '@/utils/monitoring';
import Dashboard from './pages/Dashboard';
import Administration from './pages/Administration';
import Formations from './pages/Formations';
import FormationDetail from './pages/FormationDetail';
import TextBookDetail from './pages/TextBookDetail';
import TextBookByFormation from './pages/TextBookByFormation';
import SuiviEmargement from './pages/SuiviEmargement';
import SignaturePublique from './pages/SignaturePublique';
import EmploiTemps from './pages/EmploiTemps';
import Messagerie from './pages/Messagerie';
import Groupes from './pages/Groupes';
import Emargement from './pages/Emargement';
import EmargementQR from './pages/EmargementQR';
import GestionEtablissement from './pages/GestionEtablissement';
import Compte from './pages/Compte';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import Index from './pages/Index';
import CreateEstablishment from './pages/CreateEstablishment';
import AcceptInvitation from './pages/AcceptInvitation';
import Solutions from './pages/Solutions';
import Fonctionnalites from './pages/Fonctionnalites';
import PourquoiNous from './pages/PourquoiNous';
import CGU from './pages/CGU';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import ResetPassword from './pages/ResetPassword';
import Activation from './pages/Activation';
import Notifications from './pages/Notifications';
import Documentation from './pages/Documentation';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogAdmin from './pages/BlogAdmin';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const { userId, userRole, loading: authLoading, error: authError } = useCurrentUser();
  
  // Initialize monitoring with user ID
  useEffect(() => {
    monitoring.setUserId(userId || null);
  }, [userId]);

  // Track page load performance
  useEffect(() => {
    monitoring.trackPageLoad();
  }, []);
  
  // IMPORTANT: La page de signature doit être vérifiée EN PREMIER pour éviter les 404
  // après redirection depuis /auth
  const isSignaturePage = location.pathname.startsWith('/emargement/signer/');
  if (isSignaturePage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/emargement/signer/:token" element={<SignaturePublique />} />
        </Routes>
        <Toaster />
      </div>
    );
  }

  // ============================================================================
  // BLOG ADMIN (Super Admin uniquement)
  // IMPORTANT: NE PAS inclure /blog-admin dans les "pages publiques".
  // Sinon, un Super Admin sur /blog-admin est redirigé vers /blog-admin (boucle)
  // => écran blanc (Navigate sans UI).
  // ============================================================================
  const isBlogAdminPage = location.pathname === '/blog-admin';
  if (isBlogAdminPage) {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        </div>
      );
    }

    if (authError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="max-w-md w-full text-center space-y-3">
            <h1 className="text-lg font-semibold">Impossible de charger la session</h1>
            <p className="text-sm text-muted-foreground">{authError}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
              <Button onClick={() => (window.location.href = '/auth')}>Se reconnecter</Button>
            </div>
          </div>
        </div>
      );
    }

    if (!userId) {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (userRole !== 'SuperAdmin') {
      return <Navigate to="/" replace />;
    }

    return (
      <>
        <GoogleAnalytics measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID || ''} />
        <BlogAdmin />
        <Toaster />
      </>
    );
  }
  
  const isAuthPage = location.pathname === '/auth';
  const isCreateEstablishmentPage = location.pathname === '/create-establishment' || location.pathname === '/creer-etablissement';
  const isAcceptInvitationPage = location.pathname === '/accept-invitation';
  const isResetPasswordPage = location.pathname === '/reset-password';
  const isActivationPage = location.pathname === '/activation';

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    );
  }

  if (isCreateEstablishmentPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/create-establishment" element={<CreateEstablishment />} />
          <Route path="/creer-etablissement" element={<CreateEstablishment />} />
        </Routes>
      </div>
    );
  }

  if (isAcceptInvitationPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
        </Routes>
      </div>
    );
  }

  if (isResetPasswordPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    );
  }

  if (isActivationPage) {
    return (
      <div className="min-h-screen w-full">
        <Routes>
          <Route path="/activation" element={<Activation />} />
        </Routes>
      </div>
    );
  }

  // Pages publiques (sans authentification)
  // IMPORTANT: /blog-admin est volontairement EXCLU (guard dédié ci-dessus)
  const publicPages = ['/', '/solutions', '/fonctionnalites', '/pourquoi-nous', '/cgu', '/politique-confidentialite', '/documentation', '/blog'];
  // Pages légales accessibles même connecté (CGU, Politique de Confidentialité)
  const legalPages = ['/cgu', '/politique-confidentialite'];
  const isPublicPage = publicPages.includes(location.pathname);
  const isLegalPage = legalPages.includes(location.pathname);
  
  if (isPublicPage) {
    // IMPORTANT: si l'utilisateur est connecté et arrive sur une page publique,
    // on le redirige vers l'application (sinon il reste "bloqué" sur la landing).
    // EXCEPTION: les pages légales (CGU, Politique) restent accessibles même connecté.
    if (authLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        </div>
      );
    }

    if (authError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-6">
          <div className="max-w-md w-full text-center space-y-3">
            <h1 className="text-lg font-semibold">Impossible de charger la session</h1>
            <p className="text-sm text-muted-foreground">{authError}</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
              <Button onClick={() => (window.location.href = '/auth')}>Se reconnecter</Button>
            </div>
          </div>
        </div>
      );
    }

    // Ne pas rediriger si c'est une page légale
    if (userId && !isLegalPage) {
      // Super Admin va vers /blog-admin
      if (userRole === 'SuperAdmin') {
        return <Navigate to="/blog-admin" replace />;
      }
      const home = userRole === 'Admin' || userRole === 'AdminPrincipal' ? '/dashboard' : '/formations';
      return <Navigate to={home} replace />;
    }

    return (
      <>
        <GoogleAnalytics measurementId={import.meta.env.VITE_GA_MEASUREMENT_ID || ''} />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/fonctionnalites" element={<Fonctionnalites />} />
          <Route path="/pourquoi-nous" element={<PourquoiNous />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </>
    );
  }

  // ============================================================================
  // SÉCURITÉ CRITIQUE: Ne JAMAIS afficher l'interface utilisateur avant que
  // le rôle soit complètement chargé. Cela évite les "flash" d'interfaces
  // non autorisées qui pourraient exposer des données sensibles.
  // ============================================================================
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Connexion en cours...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="max-w-md w-full text-center space-y-3">
          <h1 className="text-lg font-semibold">Session instable</h1>
          <p className="text-sm text-muted-foreground">{authError}</p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
            <Button onClick={() => (window.location.href = '/auth')}>Se reconnecter</Button>
          </div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté et n'est pas sur une page publique,
  // rediriger vers l'authentification
  if (!userId) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Super Admin: rediriger vers /blog-admin (il n'a pas accès à l'interface établissement)
  if (userRole === 'SuperAdmin') {
    return <Navigate to="/blog-admin" replace />;
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          // IMPORTANT: ces variables DOIVENT être définies sur le wrapper du provider,
          // sinon le "gap" (spacer) et la sidebar fixe n'ont pas la même largeur en mode rabattue.
          // C'est précisément ce décalage qui fait passer les en-têtes sous la barre latérale.
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "4.5rem",
        } as React.CSSProperties
      }
    >
      {/* Sidebar - desktop only (mobile uses the drawer menu from MobileHeader) */}
      <Sidebar />

      {/* Content column (must be a direct sibling of <Sidebar /> for correct inset/gap behavior) */}
      <div className="flex min-h-svh flex-1 flex-col min-w-0 bg-muted/20">
        {/* Header mobile */}
        <MobileHeader />

        {/* Header desktop (notification band) */}
        <header className="hidden md:flex h-14 sm:h-16 items-center justify-end border-b border-border/60 bg-gradient-to-r from-secondary/60 via-background/70 to-secondary/60 backdrop-blur-xl px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-muted/20">
          <Routes>
            {/* Route de signature déplacée dans le bloc public */}
            <Route path="/dashboard" element={<ProtectedRoute><AdminRoute><Dashboard /></AdminRoute></ProtectedRoute>} />
            <Route path="/administration" element={<ProtectedRoute><AdminRoute><Administration /></AdminRoute></ProtectedRoute>} />
            <Route path="/formations" element={<ProtectedRoute><Formations /></ProtectedRoute>} />
            <Route path="/formations/:formationId" element={<ProtectedRoute><FormationDetail /></ProtectedRoute>} />
            <Route path="/cahier-texte/:textBookId" element={<ProtectedRoute><TextBookDetail /></ProtectedRoute>} />
            <Route path="/cahier-texte/formation/:formationId" element={<ProtectedRoute><TextBookByFormation /></ProtectedRoute>} />
            <Route path="/suivi-emargement" element={<ProtectedRoute><SuiviEmargement /></ProtectedRoute>} />

            <Route path="/emploi-temps" element={<ProtectedRoute><EmploiTemps /></ProtectedRoute>} />
            <Route path="/emploi-temps/view/:scheduleId" element={<ProtectedRoute><EmploiTemps /></ProtectedRoute>} />
            <Route path="/emploi-temps/edit/:scheduleId" element={<ProtectedRoute><EmploiTemps /></ProtectedRoute>} />
            <Route path="/messagerie" element={<ProtectedRoute><TutorRestrictedRoute><Messagerie /></TutorRestrictedRoute></ProtectedRoute>} />
            <Route path="/groupes" element={<ProtectedRoute><TutorRestrictedRoute><Groupes /></TutorRestrictedRoute></ProtectedRoute>} />
            <Route path="/emargement" element={<ProtectedRoute><TutorRestrictedRoute><Emargement /></TutorRestrictedRoute></ProtectedRoute>} />
            <Route path="/emargement-qr" element={<ProtectedRoute><TutorRestrictedRoute><EmargementQR /></TutorRestrictedRoute></ProtectedRoute>} />
            <Route path="/gestion-etablissement" element={<ProtectedRoute><AdminPrincipalRoute><GestionEtablissement /></AdminPrincipalRoute></ProtectedRoute>} />
            <Route path="/compte" element={<ProtectedRoute><Compte /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppContent />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
