import { supabase } from '@/integrations/supabase/client';

export interface AttendanceSheet {
  id: string;
  schedule_slot_id: string;
  formation_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  instructor_id?: string;
  room?: string;
  status: string;
  session_type?: 'presentiel' | 'autonomie' | 'distanciel';
  signature_link_token?: string;
  signature_link_expires_at?: string;
  signature_link_sent_at?: string;
  is_open_for_signing?: boolean;
  opened_at?: string;
  closed_at?: string;
  validated_at?: string;
  validated_by?: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
  formations?: {
    title: string;
    level: string;
  } | null;
  instructor?: {
    first_name: string;
    last_name: string;
  } | null;
  schedule_slots?: {
    module_id?: string;
    formation_modules?: {
      title: string;
      description?: string;
    } | null;
  } | null;
  signatures?: AttendanceSignature[];
}

export interface AttendanceSignature {
  id: string;
  attendance_sheet_id: string;
  user_id: string;
  user_type: 'student' | 'instructor';
  signature_data?: string;
  signed_at: string;
  present: boolean;
  absence_reason?: string;
  absence_reason_type?: 'congé' | 'arret_travail' | 'autre' | 'injustifié' | 'mission_professionnelle' | 'entreprise';
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const attendanceService = {
  // Générer automatiquement les feuilles d'émargement depuis les créneaux d'emploi du temps
  async generateAttendanceSheets() {
    try {
      // Récupérer les créneaux pour aujourd'hui et demain qui n'ont pas encore de feuille
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { data: slots, error: slotsError } = await supabase
        .from('schedule_slots')
        .select(`
          *,
          schedules!inner(
            formation_id,
            formations(title, level)
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', tomorrow.toISOString().split('T')[0]);

      if (slotsError) throw slotsError;

      // Vérifier quels créneaux ont déjà une feuille d'émargement
      const { data: existingSheets, error: existingError } = await supabase
        .from('attendance_sheets')
        .select('schedule_slot_id');

      if (existingError) throw existingError;

      const existingSlotIds = existingSheets?.map(sheet => sheet.schedule_slot_id) || [];
      
      // Filtrer les créneaux sans feuille d'émargement
      const slotsNeedingSheets = slots?.filter(slot => 
        !existingSlotIds.includes(slot.id)
      ) || [];

      // Créer les feuilles d'émargement manquantes
      const newSheets = slotsNeedingSheets.map(slot => ({
        schedule_slot_id: slot.id,
        formation_id: slot.schedules.formation_id,
        title: `${slot.schedules.formations.title} - Feuille d'émargement`,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        instructor_id: slot.instructor_id,
        room: slot.room,
        status: 'En attente'
      }));

      if (newSheets.length > 0) {
        const { data, error } = await supabase
          .from('attendance_sheets')
          .insert(newSheets)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    } catch (error) {
      console.error('Error generating attendance sheets:', error);
      throw error;
    }
  },

  // Récupérer toutes les feuilles d'émargement
  async getAttendanceSheets() {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level),
          users:instructor_id(first_name, last_name),
          attendance_signatures(*)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching attendance sheets:', error);
      throw error;
    }
  },

  // Récupérer les feuilles d'émargement par formation
  async getAttendanceSheetsByFormation(formationId: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level),
          users:instructor_id(first_name, last_name),
          schedule_slots!schedule_slot_id(
            module_id,
            formation_modules(title, description)
          ),
          attendance_signatures(*)
        `)
        .eq('formation_id', formationId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching attendance sheets by formation:', error);
      throw error;
    }
  },

  // Récupérer les feuilles d'émargement du jour pour un utilisateur
  async getTodaysAttendanceForUser(userId: string, userRole: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level, color),
          users:instructor_id(first_name, last_name),
          attendance_signatures(*)
        `)
        .eq('date', today);

      // Si c'est un formateur, filtrer par instructor_id
      if (userRole === 'Formateur') {
        query = query.eq('instructor_id', userId);
      } else {
        // Si c'est un étudiant, filtrer par les formations auxquelles il est inscrit
        const { data: userFormations } = await supabase
          .from('user_formation_assignments')
          .select('formation_id')
          .eq('user_id', userId);

        if (userFormations && userFormations.length > 0) {
          const formationIds = userFormations.map(uf => uf.formation_id);
          query = query.in('formation_id', formationIds);
        } else {
          // Pour les tests, si pas de formations assignées, retourner toutes les feuilles
          console.log('No formations assigned to user, returning all sheets for testing');
        }
      }

      const { data, error } = await query.order('start_time');

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching today attendance for user:', error);
      throw error;
    }
  },

  // Récupérer l'historique d'émargement pour un utilisateur
  async getAttendanceHistoryForUser(userId: string, userRole: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level, color),
          users:instructor_id(first_name, last_name),
          attendance_signatures(*)
        `)
        .lt('date', today); // Seulement les dates passées

      // Si c'est un formateur, filtrer par instructor_id
      if (userRole === 'Formateur') {
        query = query.eq('instructor_id', userId);
      } else {
        // Si c'est un étudiant, filtrer par les formations auxquelles il est inscrit
        const { data: userFormations } = await supabase
          .from('user_formation_assignments')
          .select('formation_id')
          .eq('user_id', userId);

        if (userFormations && userFormations.length > 0) {
          const formationIds = userFormations.map(uf => uf.formation_id);
          query = query.in('formation_id', formationIds);
        }
      }

      const { data, error } = await query
        .order('date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching attendance history for user:', error);
      throw error;
    }
  },

  // Signer une feuille d'émargement
  async signAttendanceSheet(attendanceSheetId: string, userId: string, userType: 'student' | 'instructor', signatureData?: string) {
    try {
      // Vérifier si l'utilisateur a déjà signé
      const { data: existing } = await supabase
        .from('attendance_signatures')
        .select('id')
        .eq('attendance_sheet_id', attendanceSheetId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('Vous avez déjà signé cette feuille d\'émargement');
      }

      // Créer la signature
      const { data, error } = await supabase
        .from('attendance_signatures')
        .insert({
          attendance_sheet_id: attendanceSheetId,
          user_id: userId,
          user_type: userType,
          signature_data: signatureData,
          present: true
        })
        .select()
        .single();

      if (error) throw error;

      // Sauvegarder la signature dans user_signatures pour réutilisation (formateur et admin)
      if (signatureData && signatureData.trim() !== '' && userType === 'instructor') {
        console.log('Sauvegarde signature formateur dans user_signatures');
        const { error: userSigError } = await supabase
          .from('user_signatures')
          .upsert({
            user_id: userId,
            signature_data: signatureData
          }, {
            onConflict: 'user_id'
          });

        if (userSigError) {
          console.error('Erreur sauvegarde signature formateur dans user_signatures:', userSigError);
        } else {
          console.log('Signature formateur sauvegardée avec succès');
        }
      }

      // Mettre à jour le statut de la feuille d'émargement si nécessaire
      await supabase
        .from('attendance_sheets')
        .update({ status: 'En cours' })
        .eq('id', attendanceSheetId)
        .eq('status', 'En attente');

      return data;
    } catch (error) {
      console.error('Error signing attendance sheet:', error);
      throw error;
    }
  },

  // Vérifier si un utilisateur a signé une feuille d'émargement
  async hasUserSigned(attendanceSheetId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_signatures')
        .select('id')
        .eq('attendance_sheet_id', attendanceSheetId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking if user has signed:', error);
      return false;
    }
  },

  // Mettre à jour le statut d'une feuille d'émargement
  async updateAttendanceSheetStatus(attendanceSheetId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .update({ status })
        .eq('id', attendanceSheetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating attendance sheet status:', error);
      throw error;
    }
  },

  // Vérifier si l'émargement est ouvert pour signature
  async checkIfAttendanceOpen(attendanceSheetId: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .select('is_open_for_signing, date, start_time, end_time')
        .eq('id', attendanceSheetId)
        .single();

      if (error) throw error;
      return data?.is_open_for_signing || false;
    } catch (error) {
      console.error('Error checking attendance open status:', error);
      return false;
    }
  },

  // Marquer un étudiant comme absent avec motif
  async markStudentAbsent(attendanceSheetId: string, userId: string, reason?: string, reasonType?: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_signatures')
        .insert({
          attendance_sheet_id: attendanceSheetId,
          user_id: userId,
          user_type: 'student',
          present: false,
          absence_reason: reason,
          absence_reason_type: reasonType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking student absent:', error);
      throw error;
    }
  },

  // Mettre à jour le motif d'absence
  async updateAbsenceReason(signatureId: string, reason?: string, reasonType?: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_signatures')
        .update({
          absence_reason: reason,
          absence_reason_type: reasonType
        })
        .eq('id', signatureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating absence reason:', error);
      throw error;
    }
  },

  // Valider et signer une feuille d'émargement par l'administration
  async validateAttendanceSheet(attendanceSheetId: string, adminUserId: string, signatureData?: string) {
    try {
      console.log('Service: Début validation avec signature:', !!signatureData);
      
      const { data, error } = await supabase
        .from('attendance_sheets')
        .update({
          status: 'Validé',
          validated_at: new Date().toISOString(),
          validated_by: adminUserId
        })
        .eq('id', attendanceSheetId)
        .select()
        .single();

      if (error) throw error;

      // Ajouter la signature administrative si fournie
      if (signatureData && signatureData.trim() !== '') {
        console.log('Service: Ajout signature administrative, longueur:', signatureData.length);
        
        // Sauvegarder dans user_signatures pour réutilisation future
        const { error: userSigError } = await supabase
          .from('user_signatures')
          .upsert({
            user_id: adminUserId,
            signature_data: signatureData
          }, {
            onConflict: 'user_id'
          });

        if (userSigError) {
          console.error('Erreur sauvegarde signature administrative dans user_signatures:', userSigError);
        }
      }

      console.log('Service: Validation terminée avec succès');
      return data;
    } catch (error) {
      console.error('Error validating attendance sheet:', error);
      throw error;
    }
  },

  // Récupérer les feuilles en attente de validation
  async getPendingValidationSheets() {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations!formation_id(title, level),
          users:instructor_id(first_name, last_name),
          attendance_signatures(*)
        `)
        .eq('status', 'En attente de validation')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as any) || [];
    } catch (error) {
      console.error('Error fetching pending validation sheets:', error);
      throw error;
    }
  },

  // Générer un token de signature pour une feuille d'émargement
  async generateSignatureToken(attendanceSheetId: string): Promise<{ token: string; expiresAt: string }> {
    try {
      // Générer le token via la fonction SQL
      const { data: tokenData, error: tokenError } = await (supabase
        .rpc as any)('generate_signature_token', { sheet_id: attendanceSheetId });

      if (tokenError) throw tokenError;

      const token = tokenData as string;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire dans 24h

      return { token, expiresAt: expiresAt.toISOString() };
    } catch (error) {
      console.error('Error generating signature token:', error);
      throw error;
    }
  },

  // Valider un token de signature
  async validateSignatureToken(token: string): Promise<{ sheet_id: string; is_valid: boolean; error_message?: string } | null> {
    try {
      const { data, error } = await (supabase
        .rpc as any)('validate_signature_token', { token_param: token });

      if (error) throw error;
      
      if (Array.isArray(data) && data.length > 0) {
        return data[0] as { sheet_id: string; is_valid: boolean; error_message?: string };
      }
      return null;
    } catch (error) {
      console.error('Error validating signature token:', error);
      throw error;
    }
  },

  // Envoyer le lien de signature aux étudiants (app + email)
  async sendSignatureLink(attendanceSheetId: string, studentIds: string[]): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Appeler la fonction backend pour envoyer le message interne + notifications
      // (le client Supabase ajoute déjà le JWT; on n'a pas besoin d'ajouter Authorization ici)
      const { data, error } = await supabase.functions.invoke('send-signature-link', {
        body: {
          attendanceSheetId,
          studentIds,
        },
      });

      if (error) {
        console.error('[attendanceService.sendSignatureLink] Edge function error:', error);
        throw new Error(error.message || "Erreur lors de l'envoi du lien");
      }

      console.log('[attendanceService.sendSignatureLink] Success:', data);

      // Envoyer également les emails
      const { emailNotificationService } = await import('./emailNotificationService');
      
      // Récupérer les infos de la feuille
      const { data: sheet } = await supabase
        .from('attendance_sheets')
        .select('title, date, start_time, end_time')
        .eq('id', attendanceSheetId)
        .single();

      if (sheet) {
        for (const studentId of studentIds) {
          const { data: student } = await supabase
            .from('users')
            .select('email, first_name, last_name')
            .eq('id', studentId)
            .single();

          if (student) {
            emailNotificationService.notifyAttendanceOpen(
              student.email,
              student.first_name,
              student.last_name,
              sheet.title,
              sheet.date,
              sheet.start_time,
              sheet.end_time
            ).catch(console.error); // Fire and forget
          }
        }
      }
    } catch (error) {
      console.error('Error sending signature link:', error);
      throw error;
    }
  },

  // Ouvrir l'émargement et notifier les étudiants (app + email)
  async openAttendanceForSigning(attendanceSheetId: string): Promise<void> {
    try {
      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('attendance_sheets')
        .update({
          is_open_for_signing: true,
          opened_at: new Date().toISOString(),
          status: 'En cours'
        })
        .eq('id', attendanceSheetId);

      if (updateError) throw updateError;

      // Récupérer les infos de la feuille
      const { data: sheet } = await supabase
        .from('attendance_sheets')
        .select('title, date, start_time, end_time, formation_id')
        .eq('id', attendanceSheetId)
        .single();

      if (!sheet) return;

      // Notifications in-app
      const { notificationService } = await import('./notificationService');
      await notificationService.notifyAttendanceOpen(
        sheet.formation_id,
        sheet.title,
        attendanceSheetId,
        sheet.date,
        sheet.start_time,
        sheet.end_time
      );

      // Notifications email
      const { emailNotificationService } = await import('./emailNotificationService');
      
      const { data: userAssignments } = await supabase
        .from('user_formation_assignments')
        .select('user_id')
        .eq('formation_id', sheet.formation_id);

      if (userAssignments) {
        for (const ua of userAssignments) {
          const { data: student } = await supabase
            .from('users')
            .select('email, first_name, last_name, role')
            .eq('id', ua.user_id)
            .eq('role', 'Étudiant')
            .maybeSingle();

          if (student) {
            emailNotificationService.notifyAttendanceOpen(
              student.email,
              student.first_name,
              student.last_name,
              sheet.title,
              sheet.date,
              sheet.start_time,
              sheet.end_time
            ).catch(console.error); // Fire and forget
          }
        }
      }
    } catch (error) {
      console.error('Error opening attendance for signing:', error);
      throw error;
    }
  },

  // Récupérer une feuille d'émargement par token
  async getAttendanceSheetByToken(token: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_sheets')
        .select(`
          *,
          formations(title, level),
          users:instructor_id(first_name, last_name),
          attendance_signatures(*)
        `)
        .eq('signature_link_token', token)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Error fetching attendance sheet by token:', error);
      throw error;
    }
  },

  // S'abonner aux changements en temps réel des signatures
  subscribeToSignatures(sheetId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`signatures-${sheetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_signatures',
          filter: `attendance_sheet_id=eq.${sheetId}`
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};