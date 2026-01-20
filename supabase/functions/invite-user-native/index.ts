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

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'Admin': 'Administrateur',
    'AdminPrincipal': 'Administrateur Principal',
    'Formateur': 'Formateur',
    'Étudiant': 'Étudiant',
    'Tuteur': 'Tuteur',
  };
  return labels[role] || role;
};

const sendEmailWithMailerSend = async (
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  const apiKey = Deno.env.get("MAILERSEND_API_KEY");
  const fromEmail = Deno.env.get("MAILERSEND_FROM_EMAIL") || "NECTFORMA <noreply@nectforma.com>";
  
  if (!apiKey) {
    console.error("[MailerSend] API key not configured");
    return { success: false, error: "MAILERSEND_API_KEY not configured" };
  }

  // Parse the from email
  const fromMatch = fromEmail.match(/^(.+)\s*<(.+)>$/);
  const fromName = fromMatch ? fromMatch[1].trim() : "NECTFORMA";
  const fromAddress = fromMatch ? fromMatch[2].trim() : fromEmail;

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: fromAddress,
          name: fromName,
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MailerSend] API error:", response.status, errorText);
      return { success: false, error: `MailerSend API error: ${response.status}` };
    }

    const messageId = response.headers.get("x-message-id") || "unknown";
    console.log("[MailerSend] Email sent successfully:", messageId);
    return { success: true, messageId };
  } catch (error: any) {
    console.error("[MailerSend] Error:", error);
    return { success: false, error: error.message };
  }
};

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

    console.log("[invite-user-native] 📩 Request received");

    // Verify the requesting user is authenticated and has admin rights
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[invite-user-native] ❌ Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      console.warn("[invite-user-native] ❌ Invalid token", { authError: authError?.message });
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
      console.warn("[invite-user-native] ❌ Requesting user not found in public.users", { userDataError: userDataError?.message });
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminRoles = new Set([
      "Admin",
      "AdminPrincipal",
      "Administrateur",
      "Administrateur principal",
    ]);

    // Only admins can invite users
    if (!adminRoles.has(requestingUserData.role)) {
      console.warn("[invite-user-native] ❌ Insufficient rights", { role: requestingUserData.role });
      return new Response(
        JSON.stringify({ error: "Droits insuffisants" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[invite-user-native] ✅ Authorized", { requesterId: requestingUser.id, role: requestingUserData.role });

    const body: InviteUserRequest = await req.json();
    const { email, first_name, last_name, role, establishment_id, redirect_url } = body;

    // Validate required fields
    if (!email || !first_name || !last_name || !role || !establishment_id) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in our users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, is_activated")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Un utilisateur avec cet email existe déjà" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get establishment name for email
    const { data: establishment } = await supabaseAdmin
      .from('establishments')
      .select('name')
      .eq('id', establishment_id)
      .single();

    const establishmentName = establishment?.name || 'NECTFORMA';

    // Create auth user first (without sending Supabase email)
    const tempPassword = crypto.randomUUID();
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        first_name,
        last_name,
        role,
        establishment_id,
      },
    });

    if (authCreateError) {
      console.error("[invite-user-native] ❌ Error creating auth user:", authCreateError);
      return new Response(
        JSON.stringify({ error: authCreateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate activation token
    const activationToken = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert activation token
    const { error: tokenError } = await supabaseAdmin
      .from('user_activation_tokens')
      .insert({
        user_id: authData.user.id,
        token: activationToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("[invite-user-native] ❌ Token creation error:", tokenError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du token d'activation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user record in our users table
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
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
      console.error("[invite-user-native] ❌ Error creating user record:", insertError);
      // Rollback: delete auth user and token
      await supabaseAdmin.from('user_activation_tokens').delete().eq('user_id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'utilisateur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate activation link
    const baseUrl = redirect_url || `${req.headers.get("origin") || "https://nectforma.com"}`;
    const activationLink = `${baseUrl}/activation?token=${activationToken}`;

    // Send activation email via MailerSend
    console.log(`[invite-user-native] 📧 Sending activation email to ${email} via MailerSend`);
    console.log(`[invite-user-native] 🔗 Activation link: ${activationLink}`);
    
    const emailHtml = `
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
              Bienvenue ${first_name} ${last_name} ! 🎉
            </h2>
            
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
              Un compte a été créé pour vous sur <strong style="color: #8B5CF6;">${establishmentName}</strong> 
              en tant que <strong>${getRoleLabel(role)}</strong>.
            </p>
            
            <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
              Pour activer votre compte et choisir votre mot de passe, cliquez sur le bouton ci-dessous :
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
                Si vous n'avez pas demandé la création de ce compte, vous pouvez ignorer cet email.
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

    const emailResult = await sendEmailWithMailerSend(
      email,
      `Activez votre compte ${establishmentName} - NECTFORMA`,
      emailHtml
    );

    if (!emailResult.success) {
      console.error("[invite-user-native] ❌ MailerSend error:", emailResult.error);
      // Don't rollback - user is created, just email failed
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: "Utilisateur créé mais erreur envoi email",
          user_id: authData.user.id,
          email_error: emailResult.error
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[invite-user-native] ✅ Email sent successfully via MailerSend`, { messageId: emailResult.messageId });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation envoyée avec succès via MailerSend",
        user_id: authData.user.id,
        email_id: emailResult.messageId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[invite-user-native] ❌ Critical error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
