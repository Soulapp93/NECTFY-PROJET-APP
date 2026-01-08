import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  userEmails: string[];
  title: string;
  message: string;
  type: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmails, title, message, type }: EmailNotificationRequest = await req.json();

    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing user emails" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email notifications to ${userEmails.length} users`);

    // Get application URL from environment or use default
    const appUrl = Deno.env.get("APP_URL") || "https://nectfy.app";

    // Envoyer un email à chaque utilisateur
    const emailPromises = userEmails.map(async (email) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "NECTFY <onboarding@resend.dev>",
          to: [email],
          subject: `NECTFY - ${title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f4f5;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header with NECTFY branding -->
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">NECTFY</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Plateforme de gestion de formation</p>
                </div>
                
                <!-- Main content -->
                <div style="padding: 40px;">
                  <h2 style="color: #18181B; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">${title}</h2>
                  
                  <div style="background-color: #F4F4F5; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                    <p style="color: #3F3F46; line-height: 1.6; margin: 0; font-size: 15px;">${message}</p>
                  </div>
                  
                  <!-- Notification box -->
                  <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 4px solid #F59E0B; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                    <p style="margin: 0; color: #92400E; font-size: 14px;">
                      <strong>📬 Vous avez reçu un message sur votre espace NECTFY</strong><br>
                      <span style="color: #A16207;">Veuillez vous connecter à votre compte pour voir tous les détails.</span>
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${appUrl}/auth" 
                       style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                      Se connecter à NECTFY
                    </a>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #18181B; padding: 25px 40px; text-align: center;">
                  <p style="color: #A1A1AA; font-size: 12px; margin: 0 0 8px 0;">
                    Cet email a été envoyé automatiquement par NECTFY.
                  </p>
                  <p style="color: #71717A; font-size: 11px; margin: 0;">
                    © ${new Date().getFullYear()} NECTFY - Tous droits réservés
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${email}:`, emailResponse);
        return { email, success: true };
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        return { email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Email notifications sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sent: ${successCount} success, ${failCount} failed`,
        results
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
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
