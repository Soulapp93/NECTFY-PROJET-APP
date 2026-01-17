import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  establishment_id: string;
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

    // Verify the requesting user is authenticated and has admin rights
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

    // Get requesting user's role and establishment
    const { data: requestingUserData, error: userDataError } = await supabaseAdmin
      .from("users")
      .select("role, establishment_id")
      .eq("id", requestingUser.id)
      .single();

    if (userDataError || !requestingUserData) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only admins can invite users
    if (!["Administrateur", "Administrateur principal"].includes(requestingUserData.role)) {
      return new Response(
        JSON.stringify({ error: "Droits insuffisants" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: InviteUserRequest = await req.json();
    const { email, first_name, last_name, role, establishment_id, redirect_url } = body;

    // Validate required fields
    if (!email || !first_name || !last_name || !role || !establishment_id) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in auth
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingAuthUser) {
      // Check if user exists in our users table
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id, is_activated")
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "Un utilisateur avec cet email existe déjà" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use Supabase Auth native invitation
    const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforme.lovable.app"}`;
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${baseUrl}/activation`,
      data: {
        first_name,
        last_name,
        role,
        establishment_id,
      },
    });

    if (inviteError) {
      console.error("Erreur invitation Supabase Auth:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user record in our users table
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: inviteData.user.id,
        email: email.toLowerCase(),
        first_name,
        last_name,
        role,
        establishment_id,
        status: "pending",
        is_activated: false,
        invitation_sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Erreur création utilisateur:", insertError);
      // Rollback: delete auth user if we couldn't create the record
      await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'utilisateur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Invitation envoyée à ${email} via Supabase Auth natif`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation envoyée avec succès",
        user_id: inviteData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erreur invite-user-native:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
