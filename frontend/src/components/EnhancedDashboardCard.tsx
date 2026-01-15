import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentRisk } from '@/hooks/useDashboardStats';

interface EnhancedDashboardCardProps {
  title: string;
  icon: LucideIcon;
  type?: 'hours' | 'excellent-students' | 'risk-students' | 'default';
  // Pour le type 'hours'
  weeklyHours?: number;
  monthlyHours?: number;
  yearlyHours?: number;
  // Pour les types 'excellent-students' et 'risk-students'
  students?: StudentRisk[];
  // Pour le type 'default'
  value?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const EnhancedDashboardCard: React.FC<EnhancedDashboardCardProps> = ({
  title,
  icon: Icon,
  type = 'default',
  weeklyHours,
  monthlyHours,
  yearlyHours,
  students,
  value,
  description,
  trend
}) => {
  if (type === 'hours') {
    return (
      <Card className="bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-5 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
              <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{weeklyHours}h</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Semaine</div>
              </div>
              <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{monthlyHours}h</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Mois</div>
              </div>
              <div className="p-3 sm:p-4 bg-muted/50 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-foreground">{yearlyHours}h</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Année</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'excellent-students') {
    return (
      <Card className="bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-5 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            {title}
          </CardTitle>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {students?.length ? (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-xl text-sm sm:text-base">
                  <div className="flex-1 truncate pr-3">
                    <span className="text-foreground font-medium">{student.name}</span>
                    {student.formationName && (
                      <div className="text-xs sm:text-sm text-muted-foreground truncate mt-1">{student.formationName}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-sm sm:text-base px-3 py-1">
                    {student.attendanceRate}%
                  </Badge>
                </div>
              ))
            ) : (
              <span className="text-sm sm:text-base text-muted-foreground block p-4 text-center">Aucun étudiant avec une assiduité ≥ 90% pour cette période/formation</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'risk-students') {
    return (
      <Card className="bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-5 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            {title}
          </CardTitle>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {students?.length ? (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-xl text-sm sm:text-base">
                  <div className="flex-1 truncate pr-3">
                    <span className="text-foreground font-medium">{student.name}</span>
                    {student.formationName && (
                      <div className="text-xs sm:text-sm text-muted-foreground truncate mt-1">{student.formationName}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-sm sm:text-base px-3 py-1">
                    {student.attendanceRate}%
                  </Badge>
                </div>
              ))
            ) : (
              <span className="text-sm sm:text-base text-muted-foreground block p-4 text-center">Aucun étudiant à risque détecté pour cette période/formation</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Type default
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedDashboardCard;