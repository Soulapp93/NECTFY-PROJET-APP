import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

    // Use verified Resend domain - fallback to resend.dev for testing if custom domain not verified
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "NECTFORMA <onboarding@resend.dev>";
    
    console.log(`Sending activation email to ${email} from ${fromEmail}`);
    
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Activez votre compte NECTFORMA",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NECTFORMA</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">Plateforme de gestion de formation</p>
            </div>
            
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px;">
                Bienvenue ${firstName} ${lastName} ! 🎉
              </h2>
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                Votre compte a été créé sur <strong style="color: #8B5CF6;">NECTFORMA</strong>.
              </p>
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                Pour activer votre compte et choisir votre mot de passe, cliquez sur le bouton ci-dessous :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationUrl}" 
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
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-top: 30px;">
                Cordialement,<br>
                <strong>L'équipe NECTFORMA</strong>
              </p>
            </div>
            
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
              © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
            </p>
          </div>
        </body>
        </html>
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
