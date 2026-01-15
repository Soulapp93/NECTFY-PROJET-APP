import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, Download, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AttendanceSheet, AttendanceSignature } from '@/services/attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceSheetViewProps {
  attendanceSheet: AttendanceSheet;
  onExportPDF?: () => void;
  onValidate?: () => void;
  showActions?: boolean;
}

const AttendanceSheetView: React.FC<AttendanceSheetViewProps> = ({
  attendanceSheet: initialAttendanceSheet,
  onExportPDF,
  onValidate,
  showActions = true
}) => {
  const [attendanceSheet, setAttendanceSheet] = useState<AttendanceSheet>(initialAttendanceSheet);
  const [realTimeSignatures, setRealTimeSignatures] = useState<AttendanceSignature[]>(attendanceSheet.signatures || []);

  // Écouter les mises à jour en temps réel des signatures
  useEffect(() => {
    if (!attendanceSheet.id) return;

    const loadSignatures = async () => {
      const { data: signatures, error } = await supabase
        .from('attendance_signatures')
        .select(`
          *,
          user:users(first_name, last_name, email)
        `)
        .eq('attendance_sheet_id', attendanceSheet.id);

      if (!error && signatures) {
        setRealTimeSignatures(signatures as AttendanceSignature[]);
      }
    };

    // Charger les signatures existantes au montage
    loadSignatures();

    const channel = supabase
      .channel(`attendance_sheet_view_${attendanceSheet.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${attendanceSheet.id}`
        },
        async () => {
          console.log('Real-time signature update received');
          await loadSignatures();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attendanceSheet.id]);

  // Mettre à jour l'attendance sheet avec les nouvelles signatures
  useEffect(() => {
    setAttendanceSheet(prev => ({
      ...prev,
      signatures: realTimeSignatures
    }));
  }, [realTimeSignatures]);

  const signedUsers = realTimeSignatures?.filter(sig => sig.present) || [];
  const absentUsers = realTimeSignatures?.filter(sig => !sig.present) || [];
  const delayedUsers = realTimeSignatures?.filter(sig => sig.present && sig.user_type === 'student') || [];

  // Simulated total expected users (in production, fetch from formation enrollment)
  const totalExpectedUsers = Math.max(signedUsers.length + absentUsers.length, 8);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Présent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Retard':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div 
        className="text-white p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(280, 75%, 60%))',
        }}
      >
        <h1 className="text-2xl font-bold mb-4">FEUILLE D'ÉMARGEMENT</h1>
        <h2 className="text-lg font-semibold mb-2">{attendanceSheet.formations?.title}</h2>
        
        <div className="flex justify-center items-center space-x-8 mt-4 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr })}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{attendanceSheet.start_time.substring(0, 5)}</span>
          </div>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1" />
            <span>{attendanceSheet.room || 'A101'}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{attendanceSheet.instructor?.first_name} {attendanceSheet.instructor?.last_name}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger en PDF
            </Button>
            <Button onClick={onValidate} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Valider & Signer
            </Button>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Liste des participants ({signedUsers.length + 3})
        </h3>
        
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Nom et Prénom
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Statut
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Motif
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold">
                  Signature
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Present Users */}
              {signedUsers.map((signature, index) => (
                <tr key={signature.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {signature.user?.first_name} {signature.user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Licence Informatique L1
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Présent.e
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    -
                  </td>
                  <td className="px-4 py-3 text-center">
                    {signature.signature_data ? (
                      <img
                        src={signature.signature_data}
                        alt="Signature"
                        className="h-8 max-w-20 object-contain mx-auto border rounded"
                      />
                    ) : (
                      <div className="text-xs text-gray-400">Non signé</div>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Demo delayed user */}
              <tr className="bg-white">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Dan</div>
                      <div className="text-sm text-gray-500">Licence Informatique L1</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Retard
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  Transport
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xs text-gray-400">Non signé</div>
                </td>
              </tr>

              {/* Demo absent users */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Eva</div>
                      <div className="text-sm text-gray-500">Licence Informatique L1</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Absent.e
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  Maladie
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xs text-gray-400">Absent</div>
                </td>
              </tr>

              <tr className="bg-white">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    <div>
                      <div className="font-medium text-gray-900">Frank</div>
                      <div className="text-sm text-gray-500">Licence Informatique L1</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Absent.e
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  Autre
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="text-xs text-gray-400">Absent</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signatures Section */}
      <div className="p-6 border-t bg-gray-50">
        <div className={`grid gap-8 ${attendanceSheet.session_type === 'autonomie' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {/* Signature formateur - masquée pour les sessions en autonomie */}
          {attendanceSheet.session_type !== 'autonomie' && (
            <div className="text-center">
              <h4 className="font-semibold mb-2 text-gray-900">Signature du Formateur</h4>
              <div className="h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                {attendanceSheet.signatures?.find(sig => sig.user_type === 'instructor')?.signature_data ? (
                  <img
                    src={attendanceSheet.signatures.find(sig => sig.user_type === 'instructor')?.signature_data}
                    alt="Signature formateur"
                    className="h-16 max-w-32 object-contain"
                  />
                ) : (
                  <div className="w-32 h-12 bg-black/10 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Signature requise</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className={`text-center ${attendanceSheet.session_type === 'autonomie' ? 'max-w-md mx-auto' : ''}`}>
            <h4 className="font-semibold mb-2 text-gray-900">Signature de l'Administration</h4>
            <div className="h-20 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
              <div className="w-32 h-12 bg-black/10 rounded flex items-center justify-center">
                <span className="text-gray-500 text-xs">Signature requise</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheetView;