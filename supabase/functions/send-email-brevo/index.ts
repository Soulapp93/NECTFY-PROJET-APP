import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, string>;
  replyTo?: string;
  tags?: string[];
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

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

    // Verify authentication (optional - remove if public endpoint needed)
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.warn("Auth warning:", authError.message);
      } else {
        console.log("Authenticated user:", user?.email);
      }
    }

    const body: SendEmailRequest = await req.json();
    console.log("Email request received:", { 
      to: body.to, 
      subject: body.subject,
      hasTemplate: !!body.templateId 
    });

    // Validate required fields
    if (!body.to || !body.subject) {
      throw new Error("Destinataire et sujet requis");
    }

    // Format recipients
    const recipients = Array.isArray(body.to) 
      ? body.to.map(email => ({ email }))
      : [{ email: body.to }];

    // Build Brevo API payload
    const emailPayload: Record<string, unknown> = {
      sender: {
        name: "NECTFORMA",
        email: "noreply@nectfy.fr", // Update with your verified domain
      },
      to: recipients,
      subject: body.subject,
    };

    // Use template or direct content
    if (body.templateId) {
      emailPayload.templateId = body.templateId;
      if (body.params) {
        emailPayload.params = body.params;
      }
    } else {
      emailPayload.htmlContent = body.htmlContent;
      if (body.textContent) {
        emailPayload.textContent = body.textContent;
      }
    }

    if (body.replyTo) {
      emailPayload.replyTo = { email: body.replyTo };
    }

    if (body.tags) {
      emailPayload.tags = body.tags;
    }

    console.log("Sending email via Brevo...");

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
      throw new Error(responseData.message || "Erreur lors de l'envoi de l'email");
    }

    console.log("Email sent successfully:", responseData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: responseData.messageId,
        message: "Email envoyé avec succès" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Error in send-email-brevo:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
