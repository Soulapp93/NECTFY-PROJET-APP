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
    <div className={cn('mb-4 sm:mb-6', className)}>
      <div className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
      )}>
        <div className="flex items-center gap-2.5 sm:gap-3">
          {Icon && (
            <div className={cn(
              "h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shrink-0",
              iconClassName
            )}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">{title}</h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
