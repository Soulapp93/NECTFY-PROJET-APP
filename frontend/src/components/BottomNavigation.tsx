import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Settings,
  ClipboardCheck,
  UsersRound,
  MoreHorizontal,
  Home
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  label: string;
}

const BottomNavigation = () => {
  const { userRole } = useCurrentUser();
  const { counts: unreadCounts } = useUnreadMessages();

  // Fonction pour obtenir le badge count
  const getBadgeCount = (href: string): number => {
    if (href === '/messagerie') return unreadCounts.messagerie;
    if (href === '/groupes') return unreadCounts.groupes;
    return 0;
  };

  // Navigation pour AdminPrincipal et Admin
  const adminNavigation: NavItem[] = [
    { name: 'Accueil', href: '/dashboard', icon: Home, label: 'Accueil' },
    { name: 'Admin', href: '/administration', icon: Users, label: 'Admin' },
    { name: 'Formations', href: '/formations', icon: BookOpen, label: 'Formations' },
    { name: 'Planning', href: '/emploi-temps', icon: Calendar, label: 'Planning' },
    { name: 'Messages', href: '/messagerie', icon: MessageSquare, label: 'Messages' },
  ];

  // Navigation pour tuteurs (4 onglets - vue apprenti uniquement, pas de tableau de bord)
  const tutorNavigation: NavItem[] = [
    { name: 'Formation', href: '/formations', icon: BookOpen, label: 'Formation' },
    { name: 'Émargement', href: '/suivi-emargement', icon: ClipboardCheck, label: 'Émargement' },
    { name: 'Planning', href: '/emploi-temps', icon: Calendar, label: 'Planning' },
    { name: 'Profil', href: '/compte', icon: Settings, label: 'Profil' },
  ];

  // Navigation pour formateurs et étudiants
  const limitedNavigation: NavItem[] = [
    { name: 'Formations', href: '/formations', icon: BookOpen, label: 'Formations' },
    { name: 'Planning', href: '/emploi-temps', icon: Calendar, label: 'Planning' },
    { name: 'Suivi', href: '/suivi-emargement', icon: ClipboardCheck, label: 'Suivi' },
    { name: 'Groupes', href: '/groupes', icon: UsersRound, label: 'Groupes' },
    { name: 'Profil', href: '/compte', icon: Settings, label: 'Profil' },
  ];

  // Sélectionner la navigation selon le rôle
  const navigation = (userRole === 'AdminPrincipal' || userRole === 'Admin')
    ? adminNavigation 
    : userRole === 'Tuteur'
    ? tutorNavigation
    : limitedNavigation;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const badgeCount = getBadgeCount(item.href);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/dashboard'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all relative ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] leading-none font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
