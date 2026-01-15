import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, GraduationCap, BookText, CalendarDays, ClipboardCheck, ShieldCheck } from 'lucide-react';
import EnhancedUsersList from '../components/administration/EnhancedUsersList';
import FormationsList from '../components/administration/FormationsList';
import TextBooksList from '../components/administration/TextBooksList';
import ScheduleManagement from '../components/administration/ScheduleManagement';
import AttendanceManagement from '../components/administration/AttendanceManagement';
import { PageHeader } from '@/components/ui/page-header';
import { LucideIcon } from 'lucide-react';

const Administration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['users', 'formations', 'textbooks', 'schedules', 'attendance'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const getPageInfo = (): { title: string; description: string; icon: LucideIcon } => {
    switch (activeTab) {
      case 'users': 
        return {
          title: 'Gestion des Utilisateurs',
          description: 'Gérez les comptes utilisateurs de la plateforme.',
          icon: Users
        };
      case 'formations': 
        return {
          title: 'Gestion des Formations',
          description: 'Créez et gérez les formations proposées.',
          icon: GraduationCap
        };
      case 'textbooks': 
        return {
          title: 'Gestion des Cahiers de Texte',
          description: 'Consultez et gérez les cahiers de texte.',
          icon: BookText
        };
      case 'schedules': 
        return {
          title: 'Gestion des Emplois du Temps',
          description: 'Organisez les emplois du temps des formations.',
          icon: CalendarDays
        };
      case 'attendance': 
        return {
          title: 'Feuilles d\'émargement',
          description: 'Validez et gérez les feuilles d\'émargement.',
          icon: ClipboardCheck
        };
      default: 
        return {
          title: 'Administration',
          description: 'Gérez les utilisateurs, formations, rôles et emplois du temps de la plateforme.',
          icon: ShieldCheck
        };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <PageHeader 
        title={pageInfo.title}
        description={pageInfo.description}
        icon={pageInfo.icon}
      />

      {activeTab === 'users' && <EnhancedUsersList />}

      {activeTab === 'formations' && <FormationsList />}

      {activeTab === 'textbooks' && <TextBooksList />}

      {activeTab === 'schedules' && <ScheduleManagement />}

      {activeTab === 'attendance' && <AttendanceManagement />}

      {activeTab !== 'users' && activeTab !== 'formations' && activeTab !== 'textbooks' && activeTab !== 'schedules' && activeTab !== 'attendance' && (
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="h-8 w-8 text-primary">📋</div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Section en développement
            </h3>
            <p className="text-muted-foreground">
              Cette section sera développée prochainement. Restez connecté pour découvrir toutes les fonctionnalités.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Administration;
