import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  recipients: { email: string; firstName: string; lastName: string }[];
  subject: string;
  message: string;
  senderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, message, senderName }: BulkEmailRequest = await req.json();

    console.log(`Processing bulk email to ${recipients.length} recipients`);

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one recipient is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const recipient of recipients) {
      try {
        const emailResponse = await resend.emails.send({
          from: "NECTFY <contact@nectfy.com>",
          to: [recipient.email],
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${subject} - NECTFY</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
                      
                      <!-- Header with gradient -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 40px 40px 30px; text-align: center;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td style="background-color: #ffffff; width: 56px; height: 56px; border-radius: 12px; text-align: center; vertical-align: middle;">
                                <span style="color: #8B5CF6; font-size: 28px; font-weight: bold; line-height: 56px;">N</span>
                              </td>
                              <td style="padding-left: 16px;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">NECTFY</h1>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 16px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Plateforme de gestion éducative</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <h2 style="margin: 0 0 24px; color: #1f2937; font-size: 24px; font-weight: 600;">
                            ${subject}
                          </h2>
                          
                          <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Bonjour <strong>${recipient.firstName}</strong>,
                          </p>
                          
                          <div style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                            ${message.replace(/\n/g, '<br>')}
                          </div>
                          
                          <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Cordialement,<br>
                            <strong>${senderName}</strong>
                          </p>
                          
                          <!-- CTA Button -->
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="padding: 24px 0 0;">
                                <a href="https://nectfy.app" 
                                   style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
                                  Accéder à NECTFY
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                            © ${new Date().getFullYear()} NECTFY. Tous droits réservés.
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                            Cet email a été envoyé à ${recipient.email}
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });

        console.log(`Email sent to ${recipient.email}:`, emailResponse);
        results.success++;
      } catch (emailError: any) {
        console.error(`Failed to send email to ${recipient.email}:`, emailError);
        results.failed++;
        results.errors.push(`${recipient.email}: ${emailError.message}`);
      }
    }

    console.log(`Bulk email complete: ${results.success} sent, ${results.failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${results.success} email(s) envoyé(s) avec succès`,
        details: results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-bulk-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
