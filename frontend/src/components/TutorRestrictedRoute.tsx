import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface TutorRestrictedRouteProps {
  children: React.ReactNode;
}

/**
 * Route qui bloque l'accès aux tuteurs.
 * Les tuteurs n'ont accès qu'à: Formation Apprenti, Suivi Émargement Apprenti, Emploi du temps Apprenti, Mon Profil
 */
export const TutorRestrictedRoute: React.FC<TutorRestrictedRouteProps> = ({ children }) => {
  const { userRole, loading } = useCurrentUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Les tuteurs ne peuvent pas accéder à cette route
  if (userRole === 'Tuteur') {
    return <Navigate to="/formations" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default TutorRestrictedRoute;