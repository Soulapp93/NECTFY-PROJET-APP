import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    // Send activation email
    const emailResponse = await resend.emails.send({
      from: "NECTFORMA <noreply@nectforma.com>",
      to: [email],
      subject: `Activez votre compte ${establishmentName} - NECTFORMA`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NECTFORMA</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">Plateforme de gestion de formation</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 24px;">
                Bienvenue ${firstName} ${lastName} ! 🎉
              </h2>
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 20px;">
                Un compte a été créé pour vous sur <strong style="color: #8B5CF6;">${establishmentName}</strong> 
                en tant que <strong>${getRoleLabel(role)}</strong>.
              </p>
              
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 16px; margin-bottom: 30px;">
                Pour activer votre compte et choisir votre mot de passe, cliquez sur le bouton ci-dessous :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" 
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
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${activationLink}" style="color: #8B5CF6; word-break: break-all;">${activationLink}</a>
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Activation email sent successfully:", emailResponse);

    // Update user to mark invitation sent
    await supabase
      .from('users')
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq('id', userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email d'activation envoyé avec succès",
        messageId: emailResponse.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-user-activation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
