import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nectforma.com";
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    console.log(`Processing password reset request for: ${email}`);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // First, check if user exists in public.users table
    const { data: publicUsers, error: publicUsersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, email, establishment_id, role, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(2);

    if (publicUsersError || !publicUsers || publicUsers.length === 0) {
      console.error('User not found in public.users:', publicUsersError);
      return new Response(
        JSON.stringify({ error: "Aucun utilisateur trouvé avec cet email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (publicUsers.length > 1) {
      console.warn(`Multiple public.users rows found for email ${email}. Using the most recent one.`);
    }

    const publicUser = publicUsers[0];

    console.log(`Found user in public.users: ${publicUser.id}`);

    // Check if user exists in auth.users
    let authUser: any = null;
    let page = 1;
    const perPage = 1000;

    while (!authUser) {
      const { data: pageData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (authListError) {
        console.error('Error listing auth users:', authListError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la vérification du compte" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const users = pageData?.users ?? [];
      authUser = users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase()) ?? null;

      if (!authUser && users.length < perPage) break;

      page += 1;
      if (page > 20) break;
    }

    let resetLink: string;

    if (!authUser) {
      console.warn(`No auth account found for ${email}. Password reset cannot be sent.`);

      return new Response(
        JSON.stringify({
          error: "Compte non activé",
          message:
            "Cet utilisateur n'a pas encore activé son compte. Renvoyez plutôt une invitation d'activation.",
          action: "resend_invitation",
        }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // User exists in auth, generate recovery link normally
    console.log(`User ${email} exists in auth, generating recovery link...`);

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (linkError) {
      console.error('Error generating reset link:', linkError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du lien de réinitialisation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    resetLink = linkData.properties?.action_link || '';

    if (!resetLink) {
      console.error('No reset link generated');
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du lien" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Reset link generated successfully for ${email}`);

    const firstName = publicUser.first_name || 'Utilisateur';

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `NECTFORMA <${fromEmail}>`,
      to: [email],
      subject: "Réinitialisez votre mot de passe NECTFORMA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">NECTFORMA</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Plateforme de gestion de formation</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Bonjour ${firstName},</h2>
            
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Ce lien est valable pendant <strong>1 heure</strong>.</p>
            
            <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
            
            <p style="color: #666; font-size: 14px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${resetLink}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #666; margin: 0; font-size: 12px;">
              © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[send-password-reset] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de réinitialisation envoyé avec succès",
        email_sent: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
