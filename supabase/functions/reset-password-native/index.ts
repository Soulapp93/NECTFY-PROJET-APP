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
    
    console.log("🔄 Reset password request received");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: ResetPasswordRequest = await req.json();
    const { email, redirect_url } = body;

    console.log(`📧 Processing reset for email: ${email}`);

    if (!email) {
      console.log("❌ Email is missing");
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists in our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, role, is_activated, status")
      .eq("email", email.toLowerCase())
      .single();

    console.log(`📋 User lookup result:`, { userData, userError: userError?.message });

    if (userError || !userData) {
      console.log(`⚠️ User not found in public.users table for email: ${email}`);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "Si l'email existe, un lien de réinitialisation a été envoyé" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`👤 User found: ${userData.first_name} ${userData.last_name}, role: ${userData.role}, is_activated: ${userData.is_activated}, status: ${userData.status}`);

    // Check if user exists in auth.users
    const { data: authUserData, error: authUserError } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUserData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    console.log(`🔐 Auth user lookup:`, { 
      found: !!authUser, 
      authUserId: authUser?.id,
      authUserEmail: authUser?.email,
      emailConfirmed: authUser?.email_confirmed_at,
      authUserError: authUserError?.message 
    });

    // If user is not activated, resend invitation instead
    if (!userData.is_activated || userData.status === "pending") {
      console.log(`📨 User not activated, sending invitation instead`);
      
      const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforme.lovable.app"}`;
      
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${baseUrl}/activation`,
      });

      console.log(`📨 Invite result:`, { inviteData: inviteData?.user?.id, inviteError: inviteError?.message });

      if (inviteError) {
        console.error("❌ Erreur renvoi invitation:", inviteError);
        return new Response(
          JSON.stringify({ 
            action: "resend_invitation",
            error: "Compte non activé",
            message: "Un nouveau lien d'activation a été envoyé"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`✅ Invitation sent successfully for non-activated user`);
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
    
    console.log(`🔑 Sending password reset email to: ${email}, redirectTo: ${baseUrl}/reset-password`);
    
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    });

    console.log(`🔑 Reset password result:`, { resetData, resetError: resetError?.message, resetErrorCode: (resetError as any)?.code });

    if (resetError) {
      console.error("❌ Erreur reset password:", resetError);
      
      // Check if this is because user doesn't exist in auth.users
      if (resetError.message?.includes("User not found") || (resetError as any)?.code === "user_not_found") {
        console.log("⚠️ User not found in auth.users - may need to create auth account first");
        
        // Try to invite the user instead (this will create the auth account)
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${baseUrl}/activation`,
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
        });

        console.log(`📨 Fallback invite result:`, { inviteData: inviteData?.user?.id, inviteError: inviteError?.message });

        if (!inviteError) {
          console.log(`✅ Fallback invitation sent - user will receive activation email`);
          return new Response(
            JSON.stringify({ 
              action: "resend_invitation",
              success: true, 
              message: "Un lien d'activation a été envoyé (compte auth non trouvé)"
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
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
    console.error("❌ Erreur reset-password-native:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
