import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivationRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-activation-email: Starting...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    if (!resendApiKey) {
      console.error("send-activation-email: RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Configuration email manquante" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body: ActivationRequest = await req.json();
    const { userId, email, firstName, lastName } = body;

    const normalizedEmail = (email || "").trim().toLowerCase();

    console.log("send-activation-email: Processing for:", normalizedEmail);

    if (!userId || !normalizedEmail || !firstName) {
      return new Response(JSON.stringify({ error: "Champs requis manquants" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Génère et stocke le token côté serveur (évite les problèmes RLS côté client)
    const token = `${crypto.randomUUID()}-${Date.now()}`;

    const { error: tokenError } = await supabaseAdmin
      .from("user_activation_tokens")
      .insert([{ user_id: userId, token }]);

    if (tokenError) {
      console.error("send-activation-email: Token insert error:", tokenError);
      return new Response(JSON.stringify({ error: "Impossible de générer le lien d'activation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const activationUrl = `https://nectforme.lovable.app/activation?token=${encodeURIComponent(token)}`;
    const displayName = `${firstName}${lastName ? ` ${lastName}` : ""}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">NectForMe</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Plateforme de gestion de formation</p>
          </div>

          <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Bonjour ${displayName} !</h2>

            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Votre compte a été créé avec succès. Pour l'activer et définir votre mot de passe, cliquez sur le bouton ci-dessous :
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Activer mon compte
              </a>
            </div>

            <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              Ce lien expirera dans 24 heures. Si vous n'avez pas demandé la création de ce compte, veuillez contacter l'administrateur de votre établissement.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${activationUrl}" style="color: #667eea; word-break: break-all;">${activationUrl}</a>
            </p>
          </div>

          <p style="color: #888; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
            © 2024 NectForMe. Tous droits réservés.
          </p>
        </div>
      </body>
      </html>
    `;

    console.log("send-activation-email: Sending via Resend to:", normalizedEmail);

    const resend = new Resend(resendApiKey);
    const emailResponse = await resend.emails.send({
      from: `NectForMe <${fromEmail}>`,
      to: [normalizedEmail],
      subject: "Activez votre compte NectForMe",
      html: htmlContent,
    });

    console.log("send-activation-email: Resend response:", emailResponse);

    if (emailResponse.error) {
      console.error("send-activation-email: Resend error:", emailResponse.error);
      return new Response(JSON.stringify({ error: emailResponse.error.message || "Erreur lors de l'envoi de l'email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email d'activation envoyé", messageId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-activation-email: Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message || "Une erreur inattendue s'est produite" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);

