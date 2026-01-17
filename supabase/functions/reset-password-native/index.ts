import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
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

    const body: ResetPasswordRequest = await req.json();
    const { email, redirect_url } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists in our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, is_activated, status")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !userData) {
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "Si l'email existe, un lien de réinitialisation a été envoyé" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If user is not activated, resend invitation instead
    if (!userData.is_activated || userData.status === "pending") {
      // Use inviteUserByEmail to resend activation
      const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforme.lovable.app"}`;
      
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${baseUrl}/activation`,
      });

      if (inviteError) {
        console.error("Erreur renvoi invitation:", inviteError);
        return new Response(
          JSON.stringify({ 
            action: "resend_invitation",
            error: "Compte non activé",
            message: "Un nouveau lien d'activation a été envoyé"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          action: "resend_invitation",
          success: true,
          message: "Compte non activé - Un nouveau lien d'activation a été envoyé"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User is activated, send password reset via Supabase Auth
    const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforme.lovable.app"}`;
    
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });

    if (resetError) {
      console.error("Erreur reset password:", resetError);
      return new Response(
        JSON.stringify({ error: resetError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Lien de réinitialisation envoyé à ${email} via Supabase Auth natif`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lien de réinitialisation envoyé avec succès"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erreur reset-password-native:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
