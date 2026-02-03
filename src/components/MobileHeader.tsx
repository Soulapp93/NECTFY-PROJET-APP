import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import MobileDrawerMenu from './MobileDrawerMenu';

const MobileHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Pages principales sans bouton retour
  const mainPages = ['/dashboard', '/formations', '/emploi-temps', '/messagerie', '/groupes', '/administration', '/compte'];
  const canGoBack = !mainPages.includes(location.pathname) && location.pathname !== '/';
  
  // Titre de la page basé sur la route
  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/dashboard': 'Tableau de bord',
      '/administration': 'Administration',
      '/formations': 'Formations',
      '/emploi-temps': 'Emploi du temps',
      '/messagerie': 'Messagerie',
      '/groupes': 'Groupes',
      '/emargement': 'Émargement',
      '/emargement-qr': 'Scanner QR',
      '/suivi-emargement': 'Suivi émargement',
      '/compte': 'Mon profil',
      '/gestion-etablissement': 'Gestion établissement',
    };
    
    // Chercher une correspondance exacte ou partielle
    for (const [path, title] of Object.entries(pathMap)) {
      if (location.pathname.startsWith(path)) {
        return title;
      }
    }
    
    return 'NECTFORMA';
  };

  return (
    <>
      <header className="md:hidden h-14 flex items-center justify-between border-b bg-white px-3 sticky top-0 z-40 shadow-sm safe-area-top">
        {/* Bouton gauche: Menu hamburger ou Retour */}
        <div className="flex items-center w-10">
          {canGoBack ? (
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          ) : (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
          )}
        </div>
        
        {/* Logo et Titre au centre */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 nect-gradient rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-xs">NF</span>
          </div>
          <h1 className="text-base font-semibold text-foreground truncate max-w-[140px]">
            {getPageTitle()}
          </h1>
        </div>
        
        {/* Actions à droite */}
        <div className="flex items-center gap-1">
          <NotificationBell />
        </div>
      </header>
      
      {/* Mobile Drawer Menu */}
      <MobileDrawerMenu 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
};

export default MobileHeader;
