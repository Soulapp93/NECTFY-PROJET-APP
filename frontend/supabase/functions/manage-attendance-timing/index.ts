import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting attendance timing management...');

    // 1. Ouvrir les feuilles d'émargement (10 minutes avant le cours)
    const { data: sheetsToOpen, error: openError } = await supabase
      .from('attendance_sheets')
      .select('id, date, start_time')
      .eq('status', 'En attente')
      .eq('is_open_for_signing', false);

    if (openError) {
      console.error('Error fetching sheets to open:', openError);
    } else {
      for (const sheet of sheetsToOpen || []) {
        // Vérifier si le créneau doit être ouvert
        const courseStart = new Date(`${sheet.date}T${sheet.start_time}`);
        const openingTime = new Date(courseStart.getTime() - 10 * 60 * 1000); // 10 minutes avant
        const now = new Date();

        if (now >= openingTime && now < courseStart) {
          const { error: updateError } = await supabase
            .from('attendance_sheets')
            .update({
              status: 'En cours',
              is_open_for_signing: true,
              opened_at: now.toISOString()
            })
            .eq('id', sheet.id);

          if (updateError) {
            console.error('Error opening attendance sheet:', updateError);
          } else {
            console.log(`Opened attendance sheet ${sheet.id}`);
          }
        }
      }
    }

    // 2. Fermer les feuilles d'émargement (30 minutes après le début)
    const { data: sheetsToClose, error: closeError } = await supabase
      .from('attendance_sheets')
      .select('id, date, start_time')
      .eq('status', 'En cours')
      .eq('is_open_for_signing', true);

    if (closeError) {
      console.error('Error fetching sheets to close:', closeError);
    } else {
      for (const sheet of sheetsToClose || []) {
        // Vérifier si le créneau doit être fermé
        const courseStart = new Date(`${sheet.date}T${sheet.start_time}`);
        const closingTime = new Date(courseStart.getTime() + 30 * 60 * 1000); // 30 minutes après le début
        const now = new Date();

        if (now >= closingTime) {
          const { error: updateError } = await supabase
            .from('attendance_sheets')
            .update({
              status: 'En attente de validation',
              is_open_for_signing: false,
              closed_at: now.toISOString()
            })
            .eq('id', sheet.id);

          if (updateError) {
            console.error('Error closing attendance sheet:', updateError);
          } else {
            console.log(`Closed attendance sheet ${sheet.id}`);
          }
        }
      }
    }

    // 3. Générer les nouvelles feuilles d'émargement pour les créneaux à venir
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: slots, error: slotsError } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        schedules!inner(
          formation_id,
          status,
          formations(title, level)
        )
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', tomorrow.toISOString().split('T')[0])
      .eq('schedules.status', 'Publié');

    if (slotsError) {
      console.error('Error fetching schedule slots:', slotsError);
    } else {
      // Vérifier quels créneaux ont déjà une feuille d'émargement
      const { data: existingSheets, error: existingError } = await supabase
        .from('attendance_sheets')
        .select('schedule_slot_id');

      if (existingError) {
        console.error('Error fetching existing sheets:', existingError);
      } else {
        const existingSlotIds = existingSheets?.map(sheet => sheet.schedule_slot_id) || [];
        
        // Filtrer les créneaux sans feuille d'émargement
        const slotsNeedingSheets = slots?.filter(slot => 
          !existingSlotIds.includes(slot.id)
        ) || [];

        // Créer les feuilles d'émargement manquantes
        if (slotsNeedingSheets.length > 0) {
          const newSheets = slotsNeedingSheets.map(slot => ({
            schedule_slot_id: slot.id,
            formation_id: slot.schedules.formation_id,
            title: `${slot.schedules.formations.title} - Feuille d'émargement`,
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            instructor_id: slot.instructor_id,
            room: slot.room,
            status: 'En attente',
            is_open_for_signing: false
          }));

          const { data: createdSheets, error: createError } = await supabase
            .from('attendance_sheets')
            .insert(newSheets)
            .select();

          if (createError) {
            console.error('Error creating attendance sheets:', createError);
          } else {
            console.log(`Created ${createdSheets?.length} new attendance sheets`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance timing management completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in manage-attendance-timing function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});