import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'default' | 'formation' | 'user';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  type = 'default',
  className 
}) => {
  const getStatusClasses = () => {
    if (type === 'formation') {
      switch (status) {
        case 'Actif':
          return 'bg-success/10 text-success border-success/20';
        case 'Inactif':
          return 'bg-destructive/10 text-destructive border-destructive/20';
        case 'Brouillon':
          return 'bg-warning/10 text-warning border-warning/20';
        default:
          return 'bg-muted text-muted-foreground border-border';
      }
    }
    
    if (type === 'user') {
      switch (status) {
        case 'Actif':
          return 'bg-success/10 text-success border-success/20';
        case 'Inactif':
          return 'bg-destructive/10 text-destructive border-destructive/20';
        case 'En attente':
          return 'bg-warning/10 text-warning border-warning/20';
        default:
          return 'bg-muted text-muted-foreground border-border';
      }
    }

    // Default status classes
    return 'bg-primary/10 text-primary border-primary/20';
  };

  return (
    <span 
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full border',
        getStatusClasses(),
        className
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;