import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { firstName, lastName, email, subject, message }: ContactFormRequest = await req.json();

    if (!firstName || !lastName || !email || !subject || !message) {
      throw new Error("Tous les champs sont requis");
    }

    const subjectLabel = getSubjectLabel(subject);

    // Email to contact@nectforma.com (the business)
    const emailToContactRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NECTFORMA <noreply@nectforma.com>",
        to: ["contact@nectforma.com"],
        reply_to: email,
        subject: `[Contact] ${subjectLabel} - ${firstName} ${lastName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">📬 Nouvelle demande de contact</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px 0; color: #333;">Informations du contact</h3>
                  <p style="margin: 5px 0; color: #555;"><strong>Nom :</strong> ${firstName} ${lastName}</p>
                  <p style="margin: 5px 0; color: #555;"><strong>Email :</strong> <a href="mailto:${email}" style="color: #667eea;">${email}</a></p>
                  <p style="margin: 5px 0; color: #555;"><strong>Sujet :</strong> ${subjectLabel}</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                  <h3 style="margin: 0 0 15px 0; color: #333;">Message</h3>
                  <p style="color: #555; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                  <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Répondre à ${firstName}
                  </a>
                </div>
              </div>
              
              <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
                Ce message a été envoyé via le formulaire de contact NECTFORMA
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailToContactRes.ok) {
      const error = await emailToContactRes.text();
      console.error("Error sending email to contact:", error);
      throw new Error(`Erreur lors de l'envoi de l'email: ${error}`);
    }

    // Confirmation email to the user
    const confirmationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NECTFORMA <noreply@nectforma.com>",
        to: [email],
        subject: "Nous avons bien reçu votre message - NECTFORMA",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✅ Message bien reçu !</h1>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Bonjour ${firstName},
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                  Nous avons bien reçu votre message concernant "<strong>${subjectLabel}</strong>".
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                  Notre équipe va traiter votre demande et vous répondra dans les plus brefs délais 
                  (généralement sous 24-48 heures ouvrées).
                </p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #333;">Récapitulatif de votre message :</h3>
                  <p style="color: #555; white-space: pre-wrap; line-height: 1.5; font-style: italic;">${message}</p>
                </div>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                  À très bientôt !<br>
                  <strong>L'équipe NECTFORMA</strong>
                </p>
              </div>
              
              <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
                © 2024 NECTFORMA - La solution de gestion de formations
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!confirmationRes.ok) {
      console.warn("Warning: Confirmation email failed to send", await confirmationRes.text());
      // We don't throw here as the main email was sent successfully
    }

    console.log("Contact form emails sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Message envoyé avec succès" }),
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
