import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, FileText, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { scheduleService, ScheduleSlot } from '@/services/scheduleService';
import { toast } from 'sonner';
import QRAttendanceManager from './QRAttendanceManager';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface CreateAttendanceSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  formationTitle: string;
  formationColor: string;
}

const CreateAttendanceSessionModal: React.FC<CreateAttendanceSessionModalProps> = ({
  isOpen,
  onClose,
  formationId,
  formationTitle,
  formationColor
}) => {
  const [todaysSchedules, setTodaysSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [generatingSheet, setGeneratingSheet] = useState(false);
  const [showQRManager, setShowQRManager] = useState(false);
  const [attendanceSessionData, setAttendanceSessionData] = useState<any>(null);
  const { userId, loading: userLoading } = useCurrentUser();

  // Charger les emplois du temps du jour pour la formation  
  useEffect(() => {
    const fetchTodaySchedules = async () => {
      if (isOpen && formationId) {
        setLoading(true);
        try {
          const today = new Date().toISOString().split('T')[0];
          
          // Récupérer tous les créneaux de cette formation pour aujourd'hui
          const { data: scheduleSlots, error } = await supabase
            .from('schedule_slots')
            .select(`
              *,
              formation_modules(title),
              users(first_name, last_name),
              schedules!inner(
                id,
                formation_id,
                title,
                formations(title, color)
              )
            `)
            .eq('schedules.formation_id', formationId)
            .eq('date', today)
            .order('start_time', { ascending: true });

          if (error) throw error;
          setTodaysSchedules(scheduleSlots || []);
        } catch (error) {
          console.error('Erreur chargement emploi du temps:', error);
          toast.error('Erreur lors du chargement des cours');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTodaySchedules();
  }, [isOpen, formationId]);

  const generateAttendanceSheet = async (slot: any) => {
    // Vérifier que l'utilisateur est chargé et que userId est disponible
    if (!userId || userLoading) {
      toast.error('Utilisateur non identifié. Veuillez vous reconnecter.');
      return;
    }

    setGeneratingSheet(true);
    try {
      const scheduleSlotId = slot.id;

      // Vérifier si une session existe déjà pour ce créneau
      const { data: existingSheet, error: checkError } = await supabase
        .from('attendance_sheets')
        .select('id, status')
        .eq('schedule_slot_id', scheduleSlotId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingSheet) {
        // Une session existe déjà : on l'ouvre directement
        setAttendanceSessionData({
          ...existingSheet,
          formation_id: formationId,
          formations: { title: formationTitle, color: formationColor },
          title: slot.formation_modules?.title || formationTitle,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          room: slot.room,
          instructor_id: userId
        });
        
        // Recharger les données complètes
        const { data: fullSheet } = await supabase
          .from('attendance_sheets')
          .select('*, formations(title, color)')
          .eq('id', existingSheet.id)
          .single();
        
        if (fullSheet) {
          setAttendanceSessionData(fullSheet);
        }
        
        setShowQRManager(true);
        toast.info('Une session d\'émargement existe déjà pour ce cours. Ouverture...');
        return;
      }

      // Vérifier si userId est un UUID valide
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
      
      // Extraire les données du slot
      const moduleTitle = slot.formation_modules?.title || 'Module non défini';
      const formationTitleFromSlot = slot.schedules?.formations?.title || formationTitle;
      
      // Préparer les données pour la feuille d'émargement
      const attendanceData: any = {
        schedule_slot_id: scheduleSlotId,
        formation_id: formationId,
        title: `${formationTitleFromSlot} - ${moduleTitle}`,
        date: slot.date || new Date().toISOString().split('T')[0],
        start_time: slot.start_time,
        end_time: slot.end_time,
        room: slot.room,
        status: 'En cours',
        is_open_for_signing: true,
        opened_at: new Date().toISOString()
      };

      // N'ajouter instructor_id que si c'est un UUID valide
      if (isValidUUID) {
        attendanceData.instructor_id = userId;
      }

      // Créer la feuille d'émargement
      const { data, error } = await supabase
        .from('attendance_sheets')
        .insert(attendanceData)
        .select(`
          *,
          formations(title, color)
        `)
        .single();

      if (error) {
        // Gérer l'erreur de contrainte unique (doublon)
        if (error.code === '23505') {
          toast.error('Une session d\'émargement existe déjà pour ce cours.');
          return;
        }
        throw error;
      }

      if (data) {
        setAttendanceSessionData(data);
        setShowQRManager(true);
        
        toast.success('Session d\'émargement créée avec succès ! Vous pouvez maintenant afficher le QR code aux étudiants.');
      }
    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);
      toast.error(`Erreur lors de la génération: ${error.message}`);
    } finally {
      setGeneratingSheet(false);
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Afficher seulement HH:MM
  };

  if (showQRManager && attendanceSessionData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Gestion de l'émargement - {formationTitle}
            </DialogTitle>
          </DialogHeader>
          
          {attendanceSessionData && (
            <QRAttendanceManager
              attendanceSheet={attendanceSessionData}
              instructorId={attendanceSessionData.instructor_id || userId || ''}
              onUpdate={() => {
                // Recharger les données si nécessaire
                console.log('Session updated');
              }}
            />
          )}
          
          {!userId && (
            <div className="text-center p-8">
              <p className="text-gray-500">Chargement des informations utilisateur...</p>
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Créer une session d'émargement - {formationTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Chargement des cours du jour...</div>
            </div>
          ) : todaysSchedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun cours programmé aujourd'hui
              </h3>
              <p className="text-gray-600">
                Il n'y a pas de cours programmé pour cette formation aujourd'hui.
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                Sélectionnez le cours pour lequel vous souhaitez créer une session d'émargement :
              </div>
              
              <div className="space-y-3">
                {todaysSchedules.map((slot) => {
                  const moduleTitle = slot.formation_modules?.title || 'Module non défini';
                  const instructorName = slot.users 
                    ? `${slot.users.first_name} ${slot.users.last_name}`
                    : 'Formateur non assigné';
                  const formationTitle = slot.schedules?.formations?.title || 'Formation non définie';
                  
                  return (
                    <Card 
                      key={slot.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedSlot?.id === slot.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: formationColor }}
                            >
                              <Clock className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {moduleTitle}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}</span>
                                </div>
                                {slot.room && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{slot.room}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{instructorName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {format(new Date(), 'PPP', { locale: fr })}
                            </Badge>
                            {selectedSlot?.id === slot.id && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedSlot && (
                <div className="border-t pt-4">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Aperçu de la session d'émargement</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Formation:</strong> {selectedSlot.schedules?.formations?.title || 'Formation non définie'}</div>
                      <div><strong>Module:</strong> {selectedSlot.formation_modules?.title || 'Module non défini'}</div>
                      <div><strong>Date:</strong> {format(new Date(), 'PPP', { locale: fr })}</div>
                      <div><strong>Horaire:</strong> {selectedSlot.start_time.substring(0, 5)} - {selectedSlot.end_time.substring(0, 5)}</div>
                      {selectedSlot.room && (
                        <div><strong>Salle:</strong> {selectedSlot.room}</div>
                      )}
                      <div><strong>Formateur:</strong> {selectedSlot.users ? `${selectedSlot.users.first_name} ${selectedSlot.users.last_name}` : 'Formateur non assigné'}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => generateAttendanceSheet(selectedSlot)}
                      disabled={generatingSheet || userLoading || !userId}
                      className="flex-1"
                    >
                      {generatingSheet ? (
                        'Création de la session...'
                      ) : userLoading ? (
                        'Chargement utilisateur...'
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Créer la session d'émargement
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAttendanceSessionModal;