import React from 'react';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const getRoleClasses = () => {
    switch (role) {
      case 'Admin':
      case 'AdminPrincipal':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Formateur':
        return 'bg-info/10 text-info border-info/20';
      case 'Étudiant':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'Tuteur':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <span 
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full border',
        getRoleClasses(),
        className
      )}
    >
      {role}
    </span>
  );
};

export default RoleBadge;