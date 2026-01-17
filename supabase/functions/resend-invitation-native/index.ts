import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendInvitationRequest {
  email: string;
  redirect_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get requesting user's role
    const { data: requestingUserData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (!requestingUserData || !["Administrateur", "Administrateur principal"].includes(requestingUserData.role)) {
      return new Response(
        JSON.stringify({ error: "Droits insuffisants" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ResendInvitationRequest = await req.json();
    const { email, redirect_url } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user data for metadata
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, role, establishment_id")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resend invitation via Supabase Auth
    const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforme.lovable.app"}`;
    
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/activation`,
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        establishment_id: userData.establishment_id,
      },
    });

    if (inviteError) {
      console.error("Erreur renvoi invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update invitation_sent_at
    await supabaseAdmin
      .from("users")
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq("id", userData.id);

    console.log(`✅ Invitation renvoyée à ${email} via Supabase Auth natif`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation renvoyée avec succès"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erreur resend-invitation-native:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
