import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
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
  ChevronRight,
  CalendarDays,
  UsersRound,
  ShieldCheck,
  Settings,
  Video
} from 'lucide-react';
import {
  Sidebar as SidebarWrapper,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyContext } from '@/hooks/useMyContext';
import { useEstablishment } from '@/hooks/useEstablishment';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  subItems?: NavigationItem[];
}

const Sidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { userRole, userId } = useCurrentUser();
  const { user: myUser, relation: myRelation, establishment: myEstablishment, role: contextRole } = useMyContext();
  const { establishment } = useEstablishment();
  const { counts: unreadCounts } = useUnreadMessages();
  const location = useLocation();
  const [adminExpanded, setAdminExpanded] = useState(location.pathname === '/administration');

  const handleLogout = async () => {
    // Déconnexion Supabase
    await supabase.auth.signOut();
    
    // Rediriger vers la page d'authentification
    window.location.href = '/auth';
  };

  // Résoudre l'URL de la photo de profil depuis le bucket avatars
  const getResolvedPhotoUrl = (profilePhotoUrl: string | null | undefined): string | null => {
    if (!profilePhotoUrl) return null;
    
    // Si c'est déjà une URL complète, la retourner directement
    if (profilePhotoUrl.startsWith('http://') || profilePhotoUrl.startsWith('https://')) {
      return profilePhotoUrl;
    }
    
    // Sinon, construire l'URL publique Supabase
    const { data } = supabase.storage.from('avatars').getPublicUrl(profilePhotoUrl);
    return data?.publicUrl || null;
  };

  // Obtenir les informations utilisateur pour l'affichage
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
  
  // Sous-onglets de l'administration
  const administrationSubItems = [
    { name: 'Gestion des utilisateurs', href: '/administration?tab=users', icon: Users },
    { name: 'Gestion des formations', href: '/administration?tab=formations', icon: GraduationCap },
    { name: 'Gestion des Cahiers de Texte', href: '/administration?tab=textbooks', icon: BookText },
    { name: 'Gestion des Emplois du Temps', href: '/administration?tab=schedules', icon: CalendarDays },
    { name: 'Feuilles d\'émargement', href: '/administration?tab=attendance', icon: ClipboardCheck },
  ];
  
  // Navigation pour AdminPrincipal uniquement (avec gestion établissement et profil séparés)
  const principalAdminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, subItems: administrationSubItems },
    { name: 'Formation', href: '/formations', icon: GraduationCap },
    { name: 'E-learning', href: '/e-learning', icon: Video },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Gestion du compte', href: '/gestion-etablissement', icon: Building2 },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle },
  ];

  // Navigation pour Admin (SANS gestion du compte - réservé à AdminPrincipal)
  const adminNavigation: NavigationItem[] = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Administration', href: '/administration', icon: ShieldCheck, subItems: administrationSubItems },
    { name: 'Formation', href: '/formations', icon: GraduationCap },
    { name: 'E-learning', href: '/e-learning', icon: Video },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle },
  ];

  // Navigation pour tuteurs (4 onglets - vue apprenti uniquement, pas de tableau de bord)
  const tutorNavigation: NavigationItem[] = [
    { name: 'Formation Apprenti', href: '/formations', icon: GraduationCap },
    { name: 'Suivi Émargement Apprenti', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps Apprenti', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle },
  ];

  // Navigation pour les formateurs et étudiants (avec profil)
  const limitedNavigation: NavigationItem[] = [
    { name: 'Formation', href: '/formations', icon: GraduationCap },
    { name: 'E-learning', href: '/e-learning', icon: Video },
    { name: 'Suivi Émargement', href: '/suivi-emargement', icon: ClipboardCheck },
    { name: 'Emploi du temps', href: '/emploi-temps', icon: CalendarClock },
    { name: 'Messagerie', href: '/messagerie', icon: Mail },
    { name: 'Groupes', href: '/groupes', icon: UsersRound },
    { name: 'Mon Profil', href: '/compte', icon: UserCircle },
  ];

  // Sélectionner la navigation selon le rôle
  const navigation = userRole === 'AdminPrincipal' 
    ? principalAdminNavigation 
    : userRole === 'Admin' 
    ? adminNavigation 
    : userRole === 'Tuteur'
    ? tutorNavigation
    : limitedNavigation;

  const { toggleSidebar } = useSidebar();

  return (
    <SidebarWrapper 
      className={`${collapsed ? 'w-[72px]' : 'w-64'} nect-gradient sidebar-glow text-white shadow-2xl transition-all duration-300 overflow-hidden`}
      collapsible="icon"
    >
      {/* Header with Logo and Establishment */}
      <SidebarHeader className="relative z-10 px-3 pt-6 pb-4">
        <div className="flex flex-col gap-3">
          {/* App Logo and Name - Clickable to toggle sidebar */}
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer w-full"
            title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            {/* Logo Container with glow effect */}
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-600 to-purple-600 font-bold text-lg">NF</span>
            </div>
            {!collapsed && (
              <h1 className="text-lg font-semibold text-white tracking-wide">NECTFORMA</h1>
            )}
          </button>
          
          {/* Establishment info */}
          {!collapsed && establishment && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-8 h-8 rounded-md object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white/70" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{establishment.name}</p>
              </div>
            </div>
          )}
          
          {/* Mini establishment logo when collapsed */}
          {collapsed && establishment && (
            <div className="flex justify-center">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name}
                  className="w-9 h-9 rounded-lg object-cover border border-white/20"
                  title={establishment.name}
                />
              ) : (
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center border border-white/20" title={establishment.name}>
                  <Building2 className="w-4 h-4 text-white/70" />
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="relative z-10">
        {/* User Profile Card */}
        <div className={`mx-3 mb-6 p-3 rounded-xl bg-white/10 backdrop-blur-sm ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/30" title={collapsed ? userDisplayInfo.name : undefined}>
              <AvatarImage src={userDisplayInfo.profilePhotoUrl || ''} alt={userDisplayInfo.name} />
              <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                {userDisplayInfo.initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userDisplayInfo.name}</p>
                <p className="text-xs text-white/70">{userDisplayInfo.role}</p>
                {userDisplayInfo.relationInfo && (
                  <div className="mt-1.5 p-2 rounded-lg bg-white/5 border border-white/10">
                    {userDisplayInfo.relationInfo.type === 'tutor' ? (
                      <div className="space-y-0.5">
                        <p className="text-xs text-white/80 font-medium flex items-center gap-1.5">
                          <span className="text-sm">👨‍🏫</span> Mon Tuteur
                        </p>
                        <p className="text-xs text-white font-semibold truncate pl-5">
                          {userDisplayInfo.relationInfo.name}
                        </p>
                        {userDisplayInfo.relationInfo.company && (
                          <p className="text-xs text-white/60 truncate pl-5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            {userDisplayInfo.relationInfo.company}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-xs text-white/80 font-medium flex items-center gap-1.5">
                          <span className="text-sm">👨‍🎓</span> Mon Apprenti
                        </p>
                        <p className="text-xs text-white font-semibold truncate pl-5">
                          {userDisplayInfo.relationInfo.name}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isAdminRoute = location.pathname === '/administration';
                
                if (hasSubItems) {
                  return (
                    <SidebarMenuItem key={item.name}>
                      <div>
                        <button
                          onClick={() => setAdminExpanded(!adminExpanded)}
                          className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isAdminRoute
                              ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                              : 'text-white/90 hover:bg-white/10'
                          }`}
                          title={collapsed ? item.name : undefined}
                        >
                          <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
                            <Icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                            {!collapsed && <span>{item.name}</span>}
                          </div>
                          {!collapsed && (
                            adminExpanded ? 
                              <ChevronDown className="h-4 w-4 text-white/70" /> : 
                              <ChevronRight className="h-4 w-4 text-white/70" />
                          )}
                        </button>
                        
                        {!collapsed && adminExpanded && (
                          <div className="ml-6 mt-1 space-y-0.5">
                            {item.subItems.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const searchParams = new URLSearchParams(subItem.href.split('?')[1]);
                              const tabParam = searchParams.get('tab');
                              const currentTab = new URLSearchParams(location.search).get('tab');
                              const isSubActive = isAdminRoute && currentTab === tabParam;
                              
                              return (
                                <NavLink
                                  key={subItem.name}
                                  to={subItem.href}
                                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                    isSubActive
                                      ? 'bg-white/15 text-white font-medium'
                                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                  <span className="text-xs">{subItem.name}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </SidebarMenuItem>
                  );
                }
                
                // Déterminer le badge pour cet item
                const getBadgeCount = () => {
                  if (item.href === '/messagerie') return unreadCounts.messagerie;
                  if (item.href === '/groupes') return unreadCounts.groupes;
                  return 0;
                };
                const badgeCount = getBadgeCount();
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        end={item.href === '/' || item.href === '/dashboard'}
                        className={({ isActive }) =>
                          `flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                              : 'text-white/90 hover:bg-white/10'
                          }`
                        }
                        title={collapsed ? item.name : undefined}
                      >
                        <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
                          <Icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                          {!collapsed && <span>{item.name}</span>}
                        </div>
                        {badgeCount > 0 && !collapsed && (
                          <Badge 
                            className="ml-auto bg-emerald-500 text-white hover:bg-emerald-600 text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full"
                          >
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </Badge>
                        )}
                        {badgeCount > 0 && collapsed && (
                          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative z-10 p-3 border-t border-white/10">
        <button 
          onClick={handleLogout}
          className={`flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 w-full`}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className={`h-5 w-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </SidebarFooter>
    </SidebarWrapper>
  );
};

export default Sidebar;
