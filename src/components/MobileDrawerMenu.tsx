import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  GraduationCap,
  CalendarClock,
  Mail,
  BookText, 
  UserCircle,
  LogOut,
  ClipboardCheck,
  Building2,
  ChevronDown,
  CalendarDays,
  UsersRound,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyContext } from '@/hooks/useMyContext';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  subItems?: NavigationItem[];
}

const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({ isOpen, onClose }) => {
  const { userRole } = useCurrentUser();
  const { user: myUser, relation: myRelation, establishment: myEstablishment, role: contextRole } = useMyContext();
  const { establishment } = useEstablishment();
  const { counts: unreadCounts } = useUnreadMessages();
  const location = useLocation();
  const navigate = useNavigate();
  const [adminExpanded, setAdminExpanded] = useState(location.pathname === '/administration');

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

  const getResolvedPhotoUrl = (profilePhotoUrl: string | null | undefined): string | null => {
    if (!profilePhotoUrl) return null;
    if (profilePhotoUrl.startsWith('http://') || profilePhotoUrl.startsWith('https://')) {
      return profilePhotoUrl;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(profilePhotoUrl);
    return data?.publicUrl || null;
  };

  const getUserDisplayInfo = () => {
    if (myUser) {
      return {
        name: `${myUser.first_name} ${myUser.last_name}`,
        role: contextRole || userRole || 'Utilisateur',
        initials: `${myUser.first_name?.[0] || ''}${myUser.last_name?.[0] || ''}`.toUpperCase() || 'U',
        profilePhotoUrl: getResolvedPhotoUrl(myUser.profile_photo_url),
        relationInfo: myRelation
      };
    }
    return {
      name: 'Utilisateur',
      role: contextRole || userRole || 'Utilisateur',
      initials: 'U',
      profilePhotoUrl: null,
      relationInfo: null
    };
  };

  const userDisplayInfo = getUserDisplayInfo();
  
  const administrationSubItems = [
    { name: 'Gestion des utilisateurs', href: '/administration?tab=users', icon: Users },
    { name: 'Gestion des formations', href: '/administration?tab=formations', icon: GraduationCap },
    { name: 'Cahiers de texte', href: '/administration?tab=textbooks', icon: BookText },
    { name: 'Emplois du temps', href: '/administration?tab=schedules', icon: CalendarDays },
    { name: 'Feuilles d\'émargement', href: '/administration?tab=attendance', icon: ClipboardCheck },
  ];
  
  const principalAdminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, subItems: administrationSubItems },
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building2 },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const adminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, subItems: administrationSubItems },
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const tutorNavigation: NavigationItem[] = [
    { name: 'Formation apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Suivi émargement apprenti', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps apprenti', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const limitedNavigation: NavigationItem[] = [
    { name: 'Formations', href: '/formations', icon: GraduationCap },
    { name: 'Suivi émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon profil', href: '/compte', icon: UserCircle },
  ];

  const navigation = userRole === 'AdminPrincipal' 
    ? principalAdminNavigation 
    : userRole === 'Admin' 
    ? adminNavigation 
    : userRole === 'Tuteur'
    ? tutorNavigation
    : limitedNavigation;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - z-[60] to cover page content */}
      <div 
        className="fixed inset-0 bg-black/60 z-[60] md:hidden animate-fade-in"
        onClick={onClose}
      />
      
      {/* Drawer - z-[70] to be above backdrop */}
      <div className="fixed inset-y-0 left-0 w-[85%] max-w-[280px] nect-gradient z-[70] md:hidden shadow-2xl flex flex-col overflow-hidden rounded-r-2xl">
        {/* Subtle inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none rounded-r-2xl z-0" />
        
        {/* Header */}
        <div className="relative z-10 px-3 pt-5 pb-4">
          <div className="flex flex-col gap-3">
            {/* Logo Row with Close Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-white/20">
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent font-bold text-base">NF</span>
                </div>
                <h1 className="text-lg font-semibold text-white tracking-wide font-[Poppins]">NECTFORMA</h1>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </button>
            </div>
            
            {/* Establishment info */}
            {establishment && (
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                {establishment.logo_url ? (
                  <img 
                    src={establishment.logo_url} 
                    alt={establishment.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/20"
                  />
                ) : (
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-white/70" />
                  </div>
                )}
                <p className="text-xs font-medium text-white/90 truncate flex-1">{establishment.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="relative z-10 px-3">
          <div className="mb-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-white/20">
                <AvatarImage src={userDisplayInfo.profilePhotoUrl || ''} alt={userDisplayInfo.name} />
                <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                  {userDisplayInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">{userDisplayInfo.name}</p>
                <p className="text-[11px] text-white/60 font-medium">{userDisplayInfo.role}</p>
                {userDisplayInfo.relationInfo && (
                  <div className="mt-1.5 p-2 rounded-lg bg-white/5 border border-white/10">
                    {userDisplayInfo.relationInfo.type === 'tutor' ? (
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-white/70 font-medium flex items-center gap-1">
                          <span>👨‍🏫</span> Mon tuteur
                        </p>
                        <p className="text-[11px] text-white font-medium truncate pl-4">
                          {userDisplayInfo.relationInfo.name}
                        </p>
                        {userDisplayInfo.relationInfo.company && (
                          <p className="text-[10px] text-white/50 truncate pl-4 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            {userDisplayInfo.relationInfo.company}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-white/70 font-medium flex items-center gap-1">
                          <span>👨‍🎓</span> Mon apprenti
                        </p>
                        <p className="text-[11px] text-white font-medium truncate pl-4">
                          {userDisplayInfo.relationInfo.name}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isAdminRoute = location.pathname === '/administration';
            
            if (hasSubItems) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setAdminExpanded(!adminExpanded)}
                    className={`
                      flex items-center justify-between 
                      w-full px-3 py-2.5 
                      text-[13px] font-medium 
                      rounded-xl 
                      transition-all duration-200 
                      ${isAdminRoute
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm ring-1 ring-white/20'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    <div className={`transition-transform duration-200 ${adminExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-4 w-4 text-white/60" />
                    </div>
                  </button>
                  
                  {adminExpanded && (
                    <div className="ml-4 mt-2 space-y-1 border-l-2 border-white/20 pl-3">
                      {item.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const searchParams = new URLSearchParams(subItem.href.split('?')[1]);
                        const tabParam = searchParams.get('tab');
                        const currentTab = new URLSearchParams(location.search).get('tab');
                        const isSubActive = isAdminRoute && currentTab === tabParam;
                        
                        return (
                          <NavLink
                            key={subItem.name}
                            to={subItem.href}
                            onClick={onClose}
                            className={`
                              flex items-center gap-2 
                              px-3 py-2 
                              text-[11px] 
                              rounded-lg 
                              transition-all duration-200 
                              whitespace-nowrap
                              ${isSubActive
                                ? 'bg-white/20 text-white font-semibold shadow-sm'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                              }
                            `}
                          >
                            <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{subItem.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            const getBadgeCount = () => {
              if (item.href === '/messagerie') return unreadCounts.messagerie;
              if (item.href === '/groupes') return unreadCounts.groupes;
              return 0;
            };
            const badgeCount = getBadgeCount();
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                end={item.href === '/' || item.href === '/dashboard'}
                className={({ isActive }) =>
                  `
                    flex items-center justify-between 
                    px-3 py-2.5 
                    text-[13px] font-medium 
                    rounded-xl 
                    transition-all duration-200 
                    relative
                    ${isActive
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm ring-1 ring-white/20'
                      : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }
                  `
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {badgeCount > 0 && (
                  <Badge 
                    className="bg-success text-success-foreground hover:bg-success/90 text-[10px] min-w-[20px] h-5 flex items-center justify-center rounded-full font-semibold shadow-sm"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with logout */}
        <div className="relative z-10 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
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
