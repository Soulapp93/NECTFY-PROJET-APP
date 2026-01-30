import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Important: must include all headers sent by the web client (preflight),
  // otherwise the browser blocks the request and the UI can get stuck loading.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CreateRoomRequest {
  roomName: string;
  expiryMinutes?: number;
  maxParticipants?: number;
  enableRecording?: boolean;
  enableChat?: boolean;
  enableScreenShare?: boolean;
}

interface CreateTokenRequest {
  roomName: string;
  userId: string;
  userName: string;
  isOwner?: boolean;
  expiryMinutes?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY not configured');
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const action = body.action || 'create-room';

      if (action === 'create-room') {
        // Create or get a Daily.co room
        const { 
          roomName, 
          expiryMinutes = 120, 
          maxParticipants = 100, // Default to 100, can be increased with paid plan
          enableRecording = false,
          enableChat = true,
          enableScreenShare = true
        } = body as CreateRoomRequest;

        if (!roomName) {
          return new Response(
            JSON.stringify({ error: 'roomName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First, try to get existing room
        const getResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (getResponse.ok) {
          const existingRoom = await getResponse.json();
          console.log('Room already exists:', existingRoom.name);
          return new Response(
            JSON.stringify({ 
              success: true, 
              room: existingRoom,
              url: existingRoom.url 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Room doesn't exist, create it
        const expiryTime = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);

        const createResponse = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'private',
            properties: {
              exp: expiryTime,
              enable_chat: enableChat,
              enable_screenshare: enableScreenShare,
              enable_recording: enableRecording ? 'cloud' : undefined,
              enable_prejoin_ui: true,
              enable_network_ui: true,
              enable_knocking: false,
              start_video_off: false,
              start_audio_off: false,
              // SFU settings for scalability - switches automatically
              sfu_switchover: 2, // Switch to SFU after 2 participants
            },
          }),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error('Daily.co API error:', errorText);
          throw new Error(`Failed to create room: ${errorText}`);
        }

        const room = await createResponse.json();
        console.log('Room created successfully:', room.name);

        return new Response(
          JSON.stringify({ 
            success: true, 
            room,
            url: room.url 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'create-token') {
        // Create a meeting token for a participant
        const { 
          roomName, 
          userId, 
          userName, 
          isOwner = false,
          expiryMinutes = 120 
        } = body as CreateTokenRequest;

        if (!roomName || !userId || !userName) {
          return new Response(
            JSON.stringify({ error: 'roomName, userId, and userName are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const expiryTime = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);

        const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              room_name: roomName,
              user_id: userId,
              user_name: userName,
              is_owner: isOwner,
              exp: expiryTime,
              enable_screenshare: true,
              start_video_off: false,
              start_audio_off: false,
            },
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Daily.co token error:', errorText);
          throw new Error(`Failed to create token: ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token created for user:', userName);

        return new Response(
          JSON.stringify({ 
            success: true, 
            token: tokenData.token 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'delete-room') {
        // Delete a Daily.co room
        const { roomName } = body;

        if (!roomName) {
          return new Response(
            JSON.stringify({ error: 'roomName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const deleteResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
          },
        });

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          const errorText = await deleteResponse.text();
          throw new Error(`Failed to delete room: ${errorText}`);
        }

        console.log('Room deleted:', roomName);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'room-info') {
        // Get room information including active participants
        const { roomName } = body;

        if (!roomName) {
          return new Response(
            JSON.stringify({ error: 'roomName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const infoResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
          },
        });

        if (!infoResponse.ok) {
          if (infoResponse.status === 404) {
            return new Response(
              JSON.stringify({ error: 'Room not found', exists: false }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          throw new Error('Failed to get room info');
        }

        const roomInfo = await infoResponse.json();

        // Get presence info
        const presenceResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}/presence`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
          },
        });

        let presence = { total_count: 0, data: [] };
        if (presenceResponse.ok) {
          presence = await presenceResponse.json();
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            room: roomInfo,
            presence,
            participantCount: presence.total_count || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in daily-room function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
