import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RealtimeAttendanceIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
}

const RealtimeAttendanceIndicator: React.FC<RealtimeAttendanceIndicatorProps> = ({ 
  isConnected, 
  lastUpdate 
}) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <Wifi className="w-3 h-3" />
        ) : (
          <WifiOff className="w-3 h-3" />
        )}
        <span>{isConnected ? 'Temps réel' : 'Déconnecté'}</span>
      </Badge>
      {lastUpdate && (
        <span className="text-gray-500">
          Dernière maj: {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};

export default RealtimeAttendanceIndicator;