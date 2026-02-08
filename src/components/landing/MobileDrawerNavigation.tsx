import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronRight, ChevronDown, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface SubMenuItem {
  label: string;
  href: string;
  isAnchor?: boolean;
}

interface MenuItem {
  label: string;
  href?: string;
  isAnchor?: boolean;
  subItems?: SubMenuItem[];
}

interface MobileDrawerNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileDrawerNavigation: React.FC<MobileDrawerNavigationProps> = ({ isOpen, onClose }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      label: 'Solution',
      subItems: [
        { label: 'Tableau de bord', href: '#fonctionnalites', isAnchor: true },
        { label: 'Gestion des formations', href: '/fonctionnalites', isAnchor: false },
        { label: 'Emplois du temps', href: '/fonctionnalites', isAnchor: false },
        { label: 'Émargement digital', href: '/fonctionnalites', isAnchor: false },
        { label: 'Messagerie interne', href: '/fonctionnalites', isAnchor: false },
        { label: 'Classes virtuelles', href: '/fonctionnalites', isAnchor: false },
      ],
    },
    {
      label: 'Fonctionnalités',
      subItems: [
        { label: 'Administration', href: '/fonctionnalites', isAnchor: false },
        { label: 'Gestion des utilisateurs', href: '/fonctionnalites', isAnchor: false },
        { label: 'Cahiers de texte', href: '/fonctionnalites', isAnchor: false },
        { label: 'Groupes & Chat', href: '/fonctionnalites', isAnchor: false },
        { label: 'Espace tuteurs', href: '/fonctionnalites', isAnchor: false },
        { label: 'Gestion des profils', href: '/fonctionnalites', isAnchor: false },
      ],
    },
    {
      label: 'Pourquoi nous ?',
      href: '/pourquoi-nous',
    },
    {
      label: 'Articles & Blog',
      href: '/blog',
    },
    {
      label: 'Contact',
      href: '#contact',
      isAnchor: true,
    },
  ];

  const handleToggle = (label: string) => {
    setExpandedItem(prev => prev === label ? null : label);
  };

  const handleNavClick = () => {
    setExpandedItem(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={() => { setExpandedItem(null); onClose(); }}>
      <SheetContent 
        side="left" 
        className="w-full sm:w-[360px] p-0 border-r-0 bg-background [&>button]:hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button
              onClick={() => { setExpandedItem(null); onClose(); }}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">NF</span>
              </div>
              <span className="text-lg font-display font-bold text-foreground tracking-tight">
                NECTFORMA
              </span>
            </div>

            <Link
              to="/auth"
              onClick={handleNavClick}
              className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              Démo
            </Link>
          </div>

          {/* Purple accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            {expandedItem ? (
              /* Sub-menu view */
              <div className="animate-fade-in">
                <button
                  onClick={() => setExpandedItem(null)}
                  className="flex items-center gap-2 px-5 py-4 text-primary font-semibold text-lg w-full hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>{expandedItem}</span>
                </button>
                <div className="border-t border-border" />
                
                {menuItems
                  .find(item => item.label === expandedItem)
                  ?.subItems?.map((sub, index) => (
                    <div key={sub.label}>
                      {sub.isAnchor ? (
                        <a
                          href={sub.href}
                          onClick={handleNavClick}
                          className="flex items-center justify-between px-8 py-4 text-foreground hover:bg-muted/50 transition-colors group"
                        >
                          <span className="text-[15px] font-medium">{sub.label}</span>
                        </a>
                      ) : (
                        <Link
                          to={sub.href}
                          onClick={handleNavClick}
                          className="flex items-center justify-between px-8 py-4 text-foreground hover:bg-muted/50 transition-colors group"
                        >
                          <span className="text-[15px] font-medium">{sub.label}</span>
                        </Link>
                      )}
                      <div className="mx-5 border-b border-border/60" />
                    </div>
                  ))}
              </div>
            ) : (
              /* Main menu view */
              <div className="py-2">
                {menuItems.map((item) => (
                  <div key={item.label}>
                    {item.subItems ? (
                      <button
                        onClick={() => handleToggle(item.label)}
                        className="flex items-center justify-between w-full px-5 py-5 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-primary font-semibold text-lg">{item.label}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </button>
                    ) : item.isAnchor ? (
                      <a
                        href={item.href}
                        onClick={handleNavClick}
                        className="flex items-center justify-between w-full px-5 py-5 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-primary font-semibold text-lg">{item.label}</span>
                      </a>
                    ) : (
                      <Link
                        to={item.href!}
                        onClick={handleNavClick}
                        className="flex items-center justify-between w-full px-5 py-5 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-primary font-semibold text-lg">{item.label}</span>
                      </Link>
                    )}
                    <div className="mx-5 border-b border-border" />
                  </div>
                ))}
              </div>
            )}
          </nav>

          {/* Footer CTA */}
          <div className="p-5 border-t border-border flex items-center gap-3 safe-area-bottom">
            <Link
              to="/create-establishment"
              onClick={handleNavClick}
              className="flex-1 text-center px-5 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-md"
            >
              Essai gratuit
            </Link>
            <Link
              to="/auth"
              onClick={handleNavClick}
              className="flex-1 text-center px-5 py-3 rounded-full bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileDrawerNavigation;
