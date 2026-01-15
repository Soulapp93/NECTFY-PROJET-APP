import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeekNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onWeekSelect?: (weekStartDate: Date) => void;
  className?: string;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  selectedDate,
  onDateChange,
  onWeekSelect,
  className
}) => {
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());

  // Get current week number using ISO 8601 standard (1-53)
  const getWeekNumber = (date: Date): number => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    // January 4 is always in week 1
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count weeks from there
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  // Get start date (Monday) of a specific week in a year using ISO 8601
  const getWeekStartDate = (year: number, weekNumber: number): Date => {
    // January 4 is always in week 1
    const jan4 = new Date(year, 0, 4);
    // Find Thursday of week 1 (January 4 is always in week 1)
    const week1Thursday = new Date(jan4);
    week1Thursday.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7 + 3);
    // Find Monday of week 1
    const week1Monday = new Date(week1Thursday);
    week1Monday.setDate(week1Thursday.getDate() - 3);
    // Calculate the Monday of the specified week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
    return targetMonday;
  };

  // Get end date (Sunday) of a specific week
  const getWeekEndDate = (weekStartDate: Date): Date => {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekStartDate.getDate() + 6);
    return weekEnd;
  };

  // Get all weeks for the selected year (ISO 8601 can have 52 or 53 weeks)
  const getYearWeeks = () => {
    const weeks = [];
    
    // Calculate how many weeks are in this year
    const lastWeekOfYear = getWeekNumber(new Date(selectedYear, 11, 31));
    const maxWeeks = lastWeekOfYear >= 52 ? lastWeekOfYear : 52;
    
    for (let weekNumber = 1; weekNumber <= maxWeeks; weekNumber++) {
      const weekStartDate = getWeekStartDate(selectedYear, weekNumber);
      // Ensure the week belongs to the selected year
      if (weekStartDate.getFullYear() === selectedYear || 
          (weekNumber === 1 && weekStartDate.getFullYear() === selectedYear - 1)) {
        weeks.push({
          number: weekNumber,
          startDate: weekStartDate,
          label: `S${weekNumber}`
        });
      }
    }
    
    return weeks;
  };

  // Navigate to specific week
  const navigateToWeek = (weekStartDate: Date) => {
    onDateChange(new Date(weekStartDate));
    if (onWeekSelect) {
      onWeekSelect(new Date(weekStartDate));
    }
  };

  // Handle year change
  const handleYearChange = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? selectedYear - 1 : selectedYear + 1;
    setSelectedYear(newYear);
    // Update selected date to first week of new year
    const firstWeekStart = getWeekStartDate(newYear, 1);
    onDateChange(firstWeekStart);
  };

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedYear(date.getFullYear());
      onDateChange(date);
    }
  };

  const currentWeekNumber = getWeekNumber(selectedDate);
  const weeks = getYearWeeks();

  return (
    <div className={cn("bg-card rounded-xl shadow-sm border-2 border-primary/40", className)}>
      <div className="p-3 sm:p-4 border-b border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-foreground">Navigation par semaines</h2>
          
          <div className="flex items-center space-x-2">
            {/* Year Navigation */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleYearChange('prev')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <span className="text-xs sm:text-sm font-medium text-foreground min-w-[50px] sm:min-w-[60px] text-center">
                {selectedYear}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleYearChange('next')}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Calendar Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleCalendarSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Weeks Grid */}
        <div className="flex overflow-x-auto scrollbar-hide gap-1.5 sm:gap-2 pb-2 -mx-1 px-1">
          {weeks.map((week) => {
            const isCurrentWeek = currentWeekNumber === week.number && selectedDate.getFullYear() === selectedYear;
            const weekEndDate = getWeekEndDate(week.startDate);
            return (
              <button
                key={week.number}
                onClick={() => navigateToWeek(week.startDate)}
                className={`flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[40px] sm:min-w-[50px] border ${
                  isCurrentWeek
                    ? 'bg-primary text-primary-foreground shadow-md transform scale-105 border-primary'
                    : 'bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary border-primary/30 hover:border-primary/50'
                }`}
                title={`${week.label}: du ${format(week.startDate, 'dd/MM/yyyy')} au ${format(weekEndDate, 'dd/MM/yyyy')}`}
              >
                {week.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekNavigation;