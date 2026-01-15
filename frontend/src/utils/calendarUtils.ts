import { addWeeks, subWeeks, startOfWeek, addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface WeekInfo {
  start: string;
  end: string;
  weekNumber: number;
}

export const getWeekInfo = (date: Date): WeekInfo => {
  const startWeek = startOfWeek(date, { weekStartsOn: 1 });
  const endWeek = addDays(startWeek, 6);
  
  // Calcul du numéro de semaine approximatif
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  
  return {
    start: format(startWeek, 'd MMMM', { locale: fr }),
    end: format(endWeek, 'd MMMM yyyy', { locale: fr }),
    weekNumber
  };
};

export const navigateWeek = (currentDate: Date, direction: 'prev' | 'next' | 'today'): Date => {
  switch (direction) {
    case 'prev':
      return subWeeks(currentDate, 1);
    case 'next':
      return addWeeks(currentDate, 1);
    case 'today':
      return new Date();
    default:
      return currentDate;
  }
};

export const getWeekDays = (date: Date) => {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    days.push(addDays(monday, i));
  }
  
  return days;
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${startTime} - ${endTime}`;
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  return endTotalMinutes - startTotalMinutes;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h${mins}min`;
  }
};

export const isCurrentWeek = (date: Date): boolean => {
  const now = new Date();
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const nowWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  
  return weekStart.getTime() === nowWeekStart.getTime();
};

export const getTimeSlots = (startHour: number = 8, endHour: number = 20, interval: number = 30): string[] => {
  const slots = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  
  return slots;
};