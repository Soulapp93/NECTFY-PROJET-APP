import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  children?: React.ReactNode;
  className?: string;
  badge?: {
    icon?: LucideIcon;
    text: string;
  };
  roleBadge?: string;
  sticky?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
  className,
  badge,
  roleBadge,
  sticky = true
}) => {
  return (
      <div className={cn(
       sticky && 'sticky top-0 z-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 mb-4 sm:mb-6',
      !sticky && 'mb-4 sm:mb-6',
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0",
              iconClassName
            )}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {badge && (
            <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs">
              {badge.icon && <badge.icon className="h-3 w-3 mr-1" />}
              {badge.text}
            </Badge>
          )}
          {roleBadge && (
            <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs">
              {roleBadge}
            </Badge>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
