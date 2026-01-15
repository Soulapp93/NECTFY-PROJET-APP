
import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  clickable?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  onClick,
  clickable = false
}) => {
  return (
    <div 
      className={`glass-card rounded-xl p-4 sm:p-6 transition-all duration-300 ${
        clickable ? 'cursor-pointer floating-card hover:shadow-lg active:scale-[0.98]' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground mb-0.5 sm:mb-1">{value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
          {trend && (
            <div className="flex items-center mt-1.5 sm:mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive mr-1" />
              )}
              <span className={`text-xs sm:text-sm ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
