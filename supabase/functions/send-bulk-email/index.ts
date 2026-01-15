import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nectforma.com";
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

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Send emails to each recipient
    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: `${senderName} - NECTFORMA <${fromEmail}>`,
          to: [recipient.email],
          subject: subject,
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
                <h2 style="color: #333; margin-top: 0;">Bonjour ${recipient.firstName},</h2>
                
                <div style="white-space: pre-wrap;">${message}</div>
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
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${recipient.email}: ${error.message}`);
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }
    }

    console.log(`[send-bulk-email] Sent ${results.success} emails, ${results.failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${results.success} email(s) envoyé(s) avec succès`,
        email_sent: true,
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
