import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isNetworkError?: boolean;
}

export const ErrorState = ({ 
  title = 'Une erreur est survenue',
  message = 'Impossible de charger les données.',
  onRetry,
  isNetworkError = false
}: ErrorStateProps) => {
  const Icon = isNetworkError ? WifiOff : AlertTriangle;
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {message}
        {isNetworkError && ' Vérifiez votre connexion internet et réessayez.'}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  );
};

export const NetworkErrorBanner = ({ onRetry }: { onRetry?: () => void }) => (
  <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <WifiOff className="h-5 w-5 text-warning" />
      <div>
        <p className="font-medium text-foreground">
          Problème de connexion
        </p>
        <p className="text-sm text-muted-foreground">
          Certaines données peuvent ne pas être à jour.
        </p>
      </div>
    </div>
    {onRetry && (
      <Button 
        onClick={onRetry} 
        variant="outline" 
        size="sm"
        className="border-warning/50 hover:bg-warning/10"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Rafraîchir
      </Button>
    )}
  </div>
);
