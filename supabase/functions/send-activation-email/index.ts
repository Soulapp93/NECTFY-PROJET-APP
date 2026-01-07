
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ActivationEmailRequest {
  email: string;
  token: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, firstName, lastName }: ActivationEmailRequest = await req.json();

    // URL d'activation (vous devrez adapter selon votre domaine)
    const activationUrl = `${req.headers.get('origin') || 'http://localhost:5173'}/activation?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "NECTFY <contact@nectfy.com>",
      to: [email],
      subject: "Activez votre compte - Plateforme de formation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">Bienvenue ${firstName} ${lastName} !</h1>
          <p>Votre compte a été créé sur notre plateforme de formation.</p>
          <p>Pour activer votre compte et choisir votre mot de passe, cliquez sur le lien ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" 
               style="background-color: #8b5cf6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;">
              Activer mon compte
            </a>
          </div>
          <p><small>Ce lien expire dans 7 jours. Si vous n'avez pas demandé la création de ce compte, vous pouvez ignorer cet email.</small></p>
          <p>Cordialement,<br>L'équipe de la plateforme de formation</p>
        </div>
      `,
    });

    console.log("Email d'activation envoyé:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email d'activation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
