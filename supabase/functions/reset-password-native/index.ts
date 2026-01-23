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

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'Admin': 'Administrateur',
    'AdminPrincipal': 'Administrateur Principal',
    'Formateur': 'Formateur',
    'Étudiant': 'Étudiant',
  };
  return labels[role] || role;
};

const sendEmailWithBrevo = async (to: string, subject: string, htmlContent: string) => {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY non configurée");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "NECTFORMA",
        email: "noreply@nectforma.fr",
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[reset-password-native] ❌ Brevo API error:", errorData);
    throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    console.log("[reset-password-native] 🔄 Request received");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: ResetPasswordRequest = await req.json();
    const { email, redirect_url } = body;

    console.log(`[reset-password-native] 📧 Processing reset for email: ${email}`);

    if (!email) {
      console.log("[reset-password-native] ❌ Email is missing");
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists in our users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, role, is_activated, status, establishment_id")
      .eq("email", email.toLowerCase())
      .single();

    console.log(`[reset-password-native] 📋 User lookup result:`, { userData: userData ? { ...userData, id: userData.id } : null, userError: userError?.message });

    if (userError || !userData) {
      console.log(`[reset-password-native] ⚠️ User not found in public.users table for email: ${email}`);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "Si l'email existe, un lien de réinitialisation a été envoyé" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[reset-password-native] 👤 User found: ${userData.first_name} ${userData.last_name}, role: ${userData.role}, is_activated: ${userData.is_activated}, status: ${userData.status}`);

    // Get establishment name
    const { data: establishment } = await supabaseAdmin
      .from('establishments')
      .select('name')
      .eq('id', userData.establishment_id)
      .single();

    const establishmentName = establishment?.name || 'NECTFORMA';

    const statusRaw = (userData.status || "").toString();
    const isPendingStatus = ["pending", "en attente", "En attente"].includes(statusRaw) || statusRaw.toLowerCase() === "en attente";

    const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforme.lovable.app"}`;

    // If user is not activated, resend activation email instead
    if (!userData.is_activated || isPendingStatus) {
      console.log(`[reset-password-native] 📨 User not activated, sending activation email instead`, { is_activated: userData.is_activated, status: userData.status });

      // Delete old activation tokens
      await supabaseAdmin
        .from('user_activation_tokens')
        .delete()
        .eq('user_id', userData.id);

      // Generate new activation token
      const activationToken = crypto.randomUUID() + '-' + Date.now();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { error: tokenError } = await supabaseAdmin
        .from('user_activation_tokens')
        .insert({
          user_id: userData.id,
          token: activationToken,
          expires_at: expiresAt.toISOString()
        });

      if (tokenError) {
        console.error("[reset-password-native] ❌ Token creation error:", tokenError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la création du token d'activation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const activationLink = `${baseUrl}/activation?token=${activationToken}`;

      console.log(`[reset-password-native] 📧 Sending activation email via Brevo to ${email}`);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NECTFORMA</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">Plateforme de gestion de formation</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px;">
                Activation de votre compte 🔐
              </h2>
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                Bonjour ${userData.first_name} ${userData.last_name},
              </p>
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                Votre compte sur <strong style="color: #8B5CF6;">${establishmentName}</strong> 
                en tant que <strong>${getRoleLabel(userData.role)}</strong> n'est pas encore activé.
              </p>
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">
                  Activer mon compte
                </a>
              </div>
              
              <div style="background-color: #f8f7ff; border-radius: 12px; padding: 20px; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  <strong>⏳ Ce lien expire dans 7 jours.</strong><br>
                  Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.
                </p>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${activationLink}" style="color: #8B5CF6; word-break: break-all;">${activationLink}</a>
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResult = await sendEmailWithBrevo(
          email,
          `Activez votre compte ${establishmentName} - NECTFORMA`,
          htmlContent
        );

        console.log(`[reset-password-native] ✅ Activation email sent via Brevo`, { messageId: emailResult.messageId });

        return new Response(
          JSON.stringify({
            action: "resend_invitation",
            success: true,
            message: "Compte non activé - Un lien d'activation a été envoyé via Brevo",
            email_id: emailResult.messageId
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (emailError) {
        console.error("[reset-password-native] ❌ Brevo email error:", emailError);
        return new Response(
          JSON.stringify({ 
            action: "resend_invitation",
            error: "Erreur envoi email",
            details: emailError instanceof Error ? emailError.message : "Erreur inconnue"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // User is activated - generate password reset token
    console.log(`[reset-password-native] 🔑 User is activated, generating reset token`);

    // Generate reset token
    const resetToken = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store reset token (reuse activation tokens table or create a new entry)
    // Delete old tokens first
    await supabaseAdmin
      .from('user_activation_tokens')
      .delete()
      .eq('user_id', userData.id);

    const { error: tokenError } = await supabaseAdmin
      .from('user_activation_tokens')
      .insert({
        user_id: userData.id,
        token: resetToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("[reset-password-native] ❌ Token creation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du token de réinitialisation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    console.log(`[reset-password-native] 📧 Sending reset email via Brevo to ${email}`);
    console.log(`[reset-password-native] 🔗 Reset link: ${resetLink}`);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NECTFORMA</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">Plateforme de gestion de formation</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px;">
              Réinitialisation du mot de passe 🔐
            </h2>
            
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Bonjour ${userData.first_name} ${userData.last_name},
            </p>
            
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
              Vous avez demandé la réinitialisation de votre mot de passe sur <strong style="color: #8B5CF6;">${establishmentName}</strong>.
              Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <div style="background-color: #fff3cd; border-radius: 12px; padding: 20px; margin-top: 30px; border-left: 4px solid #ffc107;">
              <p style="color: #856404; font-size: 14px; margin: 0;">
                <strong>⚠️ Ce lien expire dans 1 heure.</strong><br>
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe actuel restera inchangé.
              </p>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${resetLink}" style="color: #8B5CF6; word-break: break-all;">${resetLink}</a>
            </p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const emailResult = await sendEmailWithBrevo(
        email,
        `Réinitialisation de votre mot de passe - NECTFORMA`,
        htmlContent
      );

      console.log(`[reset-password-native] ✅ Reset email sent successfully via Brevo`, { messageId: emailResult.messageId });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Lien de réinitialisation envoyé avec succès via Brevo",
          email_id: emailResult.messageId
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("[reset-password-native] ❌ Brevo email error:", emailError);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de l'envoi de l'email",
          details: emailError instanceof Error ? emailError.message : "Erreur inconnue"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("[reset-password-native] ❌ Critical error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
