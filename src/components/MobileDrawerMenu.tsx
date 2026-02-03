import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Settings,
  ClipboardCheck,
  UsersRound,
  Building,
  LogOut,
  User,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  profile_photo_url: string | null;
}

const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({ isOpen, onClose }) => {
  const { userId, userRole } = useCurrentUser();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, email, profile_photo_url')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUserData(data);
      }
    };

    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/auth');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  // Sections de navigation selon le rôle
  const getMenuSections = (): MenuSection[] => {
    const isAdmin = userRole === 'Admin' || userRole === 'AdminPrincipal';
    const isPrincipalAdmin = userRole === 'AdminPrincipal';
    const isTutor = userRole === 'Tuteur';
    const isInstructor = userRole === 'Formateur';
    const isStudent = userRole === 'Étudiant';

    const sections: MenuSection[] = [];

    // Navigation spécifique pour tuteurs (limitée à 4 onglets)
    if (isTutor) {
      sections.push({
        title: 'Formation Apprenti',
        items: [
          { name: 'Formation Apprenti', href: '/formations', icon: BookOpen, description: 'Formations de votre apprenti' },
          { name: 'Suivi Émargement Apprenti', href: '/suivi-emargement', icon: ClipboardCheck, description: 'Présences de votre apprenti' },
          { name: 'Emploi du temps Apprenti', href: '/emploi-temps', icon: Calendar, description: 'Planning de votre apprenti' },
        ]
      });
      
      sections.push({
        title: 'Compte',
        items: [
          { name: 'Mon profil', href: '/compte', icon: User, description: 'Paramètres du compte' },
        ]
      });
      
      return sections;
    }

    // Section principale pour admins
    if (isAdmin) {
      sections.push({
        title: 'Gestion',
        items: [
          { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, description: 'Vue d\'ensemble' },
          { name: 'Administration', href: '/administration', icon: Users, description: 'Utilisateurs, formations...' },
        ]
      });
    }

    // Section Formation
    sections.push({
      title: 'Formation',
      items: [
        { name: 'Formations', href: '/formations', icon: BookOpen, description: 'Catalogue des formations' },
        { name: 'Emploi du temps', href: '/emploi-temps', icon: Calendar, description: 'Planning des cours' },
      ]
    });

    // Section Émargement
    if (isInstructor || isStudent || isAdmin) {
      sections.push({
        title: 'Présence',
        items: [
          { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck, description: 'Historique des présences' },
          ...(isInstructor ? [{ name: 'Émargement', href: '/emargement', icon: FileText, description: 'Gestion des feuilles' }] : []),
        ]
      });
    }

    // Section Communication (pas pour les tuteurs)
    sections.push({
      title: 'Communication',
      items: [
        { name: 'Messagerie', href: '/messagerie', icon: MessageSquare, description: 'Messages et notifications' },
        { name: 'Groupes', href: '/groupes', icon: UsersRound, description: 'Discussions de groupe' },
      ]
    });

    // Section Compte
    const accountItems: MenuItem[] = [
      { name: 'Mon profil', href: '/compte', icon: User, description: 'Paramètres du compte' },
    ];

    if (isPrincipalAdmin) {
      accountItems.push({ 
        name: 'Gestion établissement', 
        href: '/gestion-etablissement', 
        icon: Building, 
        description: 'Paramètres établissement' 
      });
    }

    sections.push({
      title: 'Compte',
      items: accountItems
    });

    return sections;
  };

  const menuSections = getMenuSections();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-background z-50 md:hidden animate-slide-in-right shadow-2xl flex flex-col">
        {/* Header du drawer */}
        <div className="flex items-center justify-between p-4 border-b bg-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">NF</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">NECTFORMA</h2>
              <p className="text-xs text-primary-foreground/70">Gestion de formation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>

        {/* Infos utilisateur */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {userData?.profile_photo_url ? (
                <img 
                  src={userData.profile_photo_url} 
                  alt="Photo de profil" 
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {userData?.first_name} {userData?.last_name}
              </p>
              <p className="text-sm text-muted-foreground truncate">{userData?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-foreground hover:bg-muted'
                        }`
                      }
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs opacity-70 truncate">{item.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer avec déconnexion */}
        <div className="p-4 border-t bg-muted/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileDrawerMenu;
