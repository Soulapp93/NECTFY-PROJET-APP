import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  className?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Chargement...',
  className,
  rows = 5
}) => {
  return (
    <div className={cn('glass-card rounded-xl p-8', className)}>
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded"></div>
          ))}
        </div>
      </div>
      {message && (
        <div className="text-center mt-4">
          <p className="text-muted-foreground">{message}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingState;