import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AdminPrincipalRouteProps {
  children: React.ReactNode;
}

export const AdminPrincipalRoute: React.FC<AdminPrincipalRouteProps> = ({ children }) => {
  const { userRole, loading } = useCurrentUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Seul AdminPrincipal peut accéder à cette route
  if (userRole !== 'AdminPrincipal') {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminPrincipalRoute;
