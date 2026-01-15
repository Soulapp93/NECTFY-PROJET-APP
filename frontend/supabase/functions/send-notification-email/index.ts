import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nectforma.com";
    const { userEmails, title, message, type }: EmailNotificationRequest = await req.json();

    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing user emails" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing email notifications for ${userEmails.length} users`);

    const results = [];

    // Send emails to each user
    for (const email of userEmails) {
      try {
        await resend.emails.send({
          from: `NECTFORMA <${fromEmail}>`,
          to: [email],
          subject: `NECTFORMA - ${title}`,
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
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Notification</p>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                <h2 style="color: #333; margin-top: 0;">${title}</h2>
                
                <div style="white-space: pre-wrap;">${message}</div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://nectforma.com" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Accéder à NECTFORMA
                  </a>
                </div>
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
        results.push({ email, success: true });
      } catch (error: any) {
        console.error(`Failed to send email to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[send-notification-email] Sent ${successCount}/${userEmails.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications envoyées à ${successCount} utilisateur(s)`,
        email_sent: true,
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
