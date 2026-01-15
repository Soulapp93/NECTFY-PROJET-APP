import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const getSubjectLabel = (subject: string): string => {
  const labels: Record<string, string> = {
    demo: "Demande de démonstration",
    devis: "Demande de devis",
    support: "Support technique",
    partenariat: "Partenariat",
    autre: "Autre",
  };
  return labels[subject] || subject;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nectforma.com";
    const { firstName, lastName, email, subject, message }: ContactFormRequest = await req.json();

    if (!firstName || !lastName || !email || !subject || !message) {
      throw new Error("Tous les champs sont requis");
    }

    const subjectLabel = getSubjectLabel(subject);

    console.log(`Processing contact form from: ${firstName} ${lastName} (${email})`);
    console.log(`Subject: ${subjectLabel}`);

    // Send notification email to admin
    await resend.emails.send({
      from: `NECTFORMA Contact <${fromEmail}>`,
      to: ["contact@nectforma.com"],
      replyTo: email,
      subject: `[Contact] ${subjectLabel} - ${firstName} ${lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nouveau message de contact</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">${subjectLabel}</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Nom :</strong> ${firstName} ${lastName}</p>
              <p style="margin: 5px 0;"><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
            </div>
            
            <h3 style="color: #333;">Message :</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #666; margin: 0; font-size: 12px;">
              Ce message a été envoyé via le formulaire de contact NECTFORMA.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    // Send confirmation email to user
    await resend.emails.send({
      from: `NECTFORMA <${fromEmail}>`,
      to: [email],
      subject: "Nous avons bien reçu votre message - NECTFORMA",
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
            
            <p>Nous avons bien reçu votre message et nous vous en remercions.</p>
            
            <p>Notre équipe reviendra vers vous dans les plus brefs délais.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Objet :</strong> ${subjectLabel}</p>
            </div>
            
            <p>Cordialement,<br>L'équipe NECTFORMA</p>
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

    console.log("[send-contact-form] Contact form emails sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message envoyé avec succès",
        email_sent: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
