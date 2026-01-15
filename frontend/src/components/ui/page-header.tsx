import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
  className
}) => {
  return (
    <div className={cn('mb-6 sm:mb-8', className)}>
      <div className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          {Icon && (
            <div className={cn(
              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shrink-0",
              iconClassName
            )}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 sm:gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
