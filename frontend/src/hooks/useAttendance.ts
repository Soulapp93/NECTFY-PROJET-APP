import { useState, useEffect } from 'react';
import { attendanceService, AttendanceSheet, AttendanceSignature } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';

export const useAttendance = () => {
  const [attendanceSheets, setAttendanceSheets] = useState<AttendanceSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attendanceService.getAttendanceSheets();
      setAttendanceSheets(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des feuilles d\'émargement';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateAttendanceSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appeler la fonction edge pour générer les feuilles d'émargement
      const { data, error } = await supabase.functions.invoke('generate-attendance-sheets');
      
      if (error) throw error;
      
      console.log('Attendance sheets generated:', data);
      
      // Recharger les feuilles d'émargement
      await fetchAttendanceSheets();
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération des feuilles d\'émargement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signAttendance = async (attendanceSheetId: string, userId: string, userType: 'student' | 'instructor', signatureData?: string) => {
    try {
      const signature = await attendanceService.signAttendanceSheet(attendanceSheetId, userId, userType, signatureData);
      
      // Mettre à jour les données locales
      setAttendanceSheets(prev => 
        prev.map(sheet => 
          sheet.id === attendanceSheetId 
            ? {
                ...sheet, 
                signatures: [...(sheet.signatures || []), signature as AttendanceSignature],
                status: sheet.status === 'En attente' ? 'En cours' : sheet.status
              }
            : sheet
        )
      );
      
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la signature';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateAttendanceSheetStatus = async (attendanceSheetId: string, status: string) => {
    try {
      const updatedSheet = await attendanceService.updateAttendanceSheetStatus(attendanceSheetId, status);
      
      // Mettre à jour les données locales
      setAttendanceSheets(prev => 
        prev.map(sheet => 
          sheet.id === attendanceSheetId 
            ? { ...sheet, status }
            : sheet
        )
      );
      
      return updatedSheet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchAttendanceSheets();
  }, []);

  return {
    attendanceSheets,
    loading,
    error,
    fetchAttendanceSheets,
    generateAttendanceSheets,
    signAttendance,
    updateAttendanceSheetStatus,
    refetch: fetchAttendanceSheets
  };
};