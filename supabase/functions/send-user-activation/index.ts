import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivationRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  establishmentId: string;
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'Admin': 'Administrateur',
    'AdminPrincipal': 'Administrateur Principal',
    'Formateur': 'Formateur',
    'Étudiant': 'Étudiant',
  };
  return labels[role] || role;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nectforma.com";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { userId, email, firstName, lastName, role, establishmentId }: ActivationRequest = await req.json();

    console.log("Creating activation token for user:", email);

    // Validate required fields
    if (!userId || !email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get establishment name
    const { data: establishment } = await supabase
      .from('establishments')
      .select('name')
      .eq('id', establishmentId)
      .single();

    const establishmentName = establishment?.name || 'NECTFORMA';

    // Generate unique activation token
    const token = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert activation token
    const { error: tokenError } = await supabase
      .from('user_activation_tokens')
      .insert({
        user_id: userId,
        token: token,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("Token creation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du token d'activation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate activation link
    const baseUrl = req.headers.get('origin') || 'https://nectforma.com';
    const activationLink = `${baseUrl}/activation?token=${token}`;

    console.log(`[send-user-activation] Activation link: ${activationLink}`);

    const roleLabel = getRoleLabel(role);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `NECTFORMA <${fromEmail}>`,
      to: [email],
      subject: `Activez votre compte ${establishmentName} - NECTFORMA`,
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
            <h2 style="color: #333; margin-top: 0;">Bonjour ${firstName} ${lastName},</h2>
            
            <p>Votre compte a été créé sur <strong>${establishmentName}</strong> en tant que <strong>${roleLabel}</strong>.</p>
            
            <p>Pour activer votre compte et créer votre mot de passe, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Activer mon compte
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Ce lien est valable pendant <strong>7 jours</strong>.</p>
            
            <p style="color: #666; font-size: 14px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${activationLink}</p>
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

    console.log("[send-user-activation] Email sent successfully:", emailResponse);

    // Update user to mark invitation sent
    await supabase
      .from('users')
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email d'activation envoyé avec succès",
        activationLink: activationLink,
        email_sent: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[send-user-activation] Critical error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur interne du serveur",
        stack: error.stack 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
