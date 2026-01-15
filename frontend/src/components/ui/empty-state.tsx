import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'premium' | 'outline';
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn('glass-card rounded-xl p-8 text-center', className)}>
      <div className="max-w-md mx-auto">
        {Icon && (
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground mb-4">
          {description}
        </p>
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'premium'}
            className="px-6 py-2"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;