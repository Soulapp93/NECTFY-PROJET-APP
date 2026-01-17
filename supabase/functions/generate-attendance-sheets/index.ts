import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting automatic attendance sheet generation...');

    // Obtenir la date et l'heure actuelles
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    // Calculer l'heure dans 10 minutes
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
    const tenMinutesLaterTime = tenMinutesLater.toTimeString().split(' ')[0].substring(0, 5);

    console.log(`Current time: ${currentTime}, Looking for classes starting at: ${tenMinutesLaterTime}`);

    // Récupérer les créneaux qui commencent dans 10 minutes
    const { data: upcomingSlots, error: slotsError } = await supabase
      .from('schedule_slots')
      .select(`
        *,
        schedules!inner(
          formation_id,
          status,
          formations(title, level)
        )
      `)
      .eq('date', currentDate)
      .eq('start_time', tenMinutesLaterTime)
      .eq('schedules.status', 'Publié');

    if (slotsError) {
      console.error('Error fetching upcoming slots:', slotsError);
      throw slotsError;
    }

    console.log(`Found ${upcomingSlots?.length || 0} upcoming slots`);

    if (!upcomingSlots || upcomingSlots.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No upcoming classes found',
          count: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Vérifier quels créneaux ont déjà une feuille d'émargement
    const slotIds = upcomingSlots.map(slot => slot.id);
    const { data: existingSheets, error: existingError } = await supabase
      .from('attendance_sheets')
      .select('schedule_slot_id')
      .in('schedule_slot_id', slotIds);

    if (existingError) {
      console.error('Error checking existing sheets:', existingError);
      throw existingError;
    }

    const existingSlotIds = existingSheets?.map(sheet => sheet.schedule_slot_id) || [];
    
    // Filtrer les créneaux qui n'ont pas encore de feuille d'émargement
    const slotsNeedingSheets = upcomingSlots.filter(slot => 
      !existingSlotIds.includes(slot.id)
    );

    console.log(`${slotsNeedingSheets.length} slots need attendance sheets`);

    if (slotsNeedingSheets.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'All upcoming classes already have attendance sheets',
          count: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

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

    const { data: createdSheets, error: createError } = await supabase
      .from('attendance_sheets')
      .insert(newSheets)
      .select();

    if (createError) {
      console.error('Error creating attendance sheets:', createError);
      throw createError;
    }

    console.log(`Successfully created ${createdSheets?.length || 0} attendance sheets`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully generated ${createdSheets?.length || 0} attendance sheets`,
        count: createdSheets?.length || 0,
        sheets: createdSheets
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error('Error in generate-attendance-sheets function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: error
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});