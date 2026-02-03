import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Email de destination pour recevoir les demandes
const ADMIN_EMAIL = "contact@nectforma.com";

const subjectLabels: Record<string, string> = {
  demo: "Demande de démonstration",
  devis: "Demande de devis",
  support: "Support technique",
  partenariat: "Partenariat",
  autre: "Autre",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not configured");
      throw new Error("Service email non configuré");
    }

    const body: ContactFormRequest = await req.json();
    console.log("Contact form received:", { 
      from: body.email, 
      subject: body.subject,
      name: `${body.firstName} ${body.lastName}`
    });

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.subject || !body.message) {
      throw new Error("Tous les champs sont requis");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new Error("Adresse email invalide");
    }

    const subjectLabel = subjectLabels[body.subject] || body.subject;

    // Build email content for admin
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #059669; margin-bottom: 5px; }
    .value { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; }
    .message-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📩 Nouveau message de contact</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">NECTFORMA - Formulaire de contact</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">👤 Nom complet</div>
        <div class="value">${body.firstName} ${body.lastName}</div>
      </div>
      <div class="field">
        <div class="label">📧 Email</div>
        <div class="value"><a href="mailto:${body.email}">${body.email}</a></div>
      </div>
      <div class="field">
        <div class="label">📋 Sujet</div>
        <div class="value">${subjectLabel}</div>
      </div>
      <div class="field">
        <div class="label">💬 Message</div>
        <div class="message-box">${body.message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">
      <p>Ce message a été envoyé depuis le formulaire de contact de nectforma.com</p>
      <p>Date: ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Build Brevo API payload
    const emailPayload = {
      sender: {
        name: "NECTFORMA Contact",
        email: "noreply@nectforma.com",
      },
      to: [{ email: ADMIN_EMAIL }],
      replyTo: { email: body.email, name: `${body.firstName} ${body.lastName}` },
      subject: `[NECTFORMA] ${subjectLabel} - ${body.firstName} ${body.lastName}`,
      htmlContent: htmlContent,
      tags: ["contact-form", body.subject],
    };

    console.log("Sending contact form email via Brevo...");

    // Send via Brevo API
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Brevo API error:", responseData);
      throw new Error(responseData.message || "Erreur lors de l'envoi du message");
    }

    console.log("Contact form email sent successfully:", responseData);

    // Send confirmation email to the user
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Message reçu !</h1>
    </div>
    <div class="content">
      <p>Bonjour ${body.firstName},</p>
      <p>Nous avons bien reçu votre message concernant "<strong>${subjectLabel}</strong>".</p>
      <p>Notre équipe vous répondra dans les plus brefs délais.</p>
      <p>Cordialement,<br><strong>L'équipe NECTFORMA</strong></p>
    </div>
    <div class="footer">
      <p>NECTFORMA - Plateforme de gestion de la formation</p>
      <p><a href="https://nectforma.com">nectforma.com</a></p>
    </div>
  </div>
</body>
</html>
    `;

    const confirmationPayload = {
      sender: {
        name: "NECTFORMA",
        email: "noreply@nectforma.com",
      },
      to: [{ email: body.email }],
      subject: "Confirmation de réception de votre message - NECTFORMA",
      htmlContent: confirmationHtml,
      tags: ["contact-form-confirmation"],
    };

    await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(confirmationPayload),
    });

    console.log("Confirmation email sent to user");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message envoyé avec succès" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Error in send-contact-form:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
