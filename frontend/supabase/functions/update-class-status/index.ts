import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting virtual class status update process...')

    // Calculate the cutoff time (24 hours ago from current time)
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 24)
    const cutoffDate = cutoffTime.toISOString().split('T')[0] // YYYY-MM-DD format
    const cutoffTimeOnly = cutoffTime.toTimeString().split(' ')[0].slice(0, 5) // HH:MM format

    console.log(`Looking for classes before: ${cutoffDate} ${cutoffTimeOnly}`)

    // Find virtual classes that should be marked as "Terminé"
    // Classes that are either "En cours" or "Programmé" and their end time was more than 24h ago
    const { data: classesToUpdate, error: selectError } = await supabase
      .from('virtual_classes')
      .select('id, title, date, end_time, status')
      .in('status', ['En cours', 'Programmé'])
      .lt('date', cutoffDate)

    if (selectError) {
      console.error('Error fetching classes:', selectError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch classes' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${classesToUpdate?.length || 0} classes to potentially update`)

    if (!classesToUpdate || classesToUpdate.length === 0) {
      console.log('No classes need status update')
      return new Response(
        JSON.stringify({ 
          message: 'No classes need status update',
          updated: 0 
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Filter classes where the end time + 24h has passed
    const classesToMarkAsTerminated = classesToUpdate.filter(cls => {
      const classDateTime = new Date(`${cls.date}T${cls.end_time}:00`)
      const twentyFourHoursAfterEnd = new Date(classDateTime.getTime() + (24 * 60 * 60 * 1000))
      return new Date() >= twentyFourHoursAfterEnd
    })

    console.log(`${classesToMarkAsTerminated.length} classes will be marked as terminated`)

    if (classesToMarkAsTerminated.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No classes ready to be terminated yet',
          updated: 0 
        }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the classes to "Terminé" status
    const classIds = classesToMarkAsTerminated.map(cls => cls.id)
    
    const { error: updateError } = await supabase
      .from('virtual_classes')
      .update({ status: 'Terminé' })
      .in('id', classIds)

    if (updateError) {
      console.error('Error updating class status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update class status' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const updatedTitles = classesToMarkAsTerminated.map(cls => cls.title)
    console.log(`Successfully updated ${classesToMarkAsTerminated.length} classes:`, updatedTitles)

    return new Response(
      JSON.stringify({ 
        message: `Successfully updated ${classesToMarkAsTerminated.length} classes to terminated status`,
        updated: classesToMarkAsTerminated.length,
        classes: updatedTitles
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})