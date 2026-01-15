import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  establishment_id: string;
  created_by: string;
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
    
    const { email, first_name, last_name, role, establishment_id, created_by }: InvitationRequest = await req.json();

    console.log("Creating invitation for:", email, "role:", role);

    // Validate required fields
    if (!email || !role || !establishment_id || !created_by) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('establishment_id', establishment_id)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Un utilisateur avec cet email existe déjà dans cet établissement" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('establishment_id', establishment_id)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: "Une invitation est déjà en attente pour cet email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get establishment name
    const { data: establishment } = await supabase
      .from('establishments')
      .select('name')
      .eq('id', establishment_id)
      .single();

    if (!establishment) {
      return new Response(
        JSON.stringify({ error: "Établissement non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate secure token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invitation_token');

    if (tokenError || !tokenData) {
      console.error("Token generation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = tokenData;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        first_name,
        last_name,
        role,
        token,
        establishment_id,
        created_by,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Invitation creation error:", invitationError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'invitation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate invitation link
    const baseUrl = req.headers.get('origin') || 'https://nectforma.com';
    const invitationLink = `${baseUrl}/accept-invitation?token=${token}`;

    console.log(`[send-invitation] Invitation created for ${email}`);
    console.log(`[send-invitation] Invitation link: ${invitationLink}`);

    // Send email via Resend
    const firstName = first_name || 'Utilisateur';
    const roleLabel = getRoleLabel(role);

    const emailResponse = await resend.emails.send({
      from: `NECTFORMA <${fromEmail}>`,
      to: [email],
      subject: `Invitation à rejoindre ${establishment.name} sur NECTFORMA`,
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
            
            <p>Vous êtes invité(e) à rejoindre <strong>${establishment.name}</strong> sur NECTFORMA en tant que <strong>${roleLabel}</strong>.</p>
            
            <p>Pour créer votre compte et accéder à votre espace, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Accepter l'invitation
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Ce lien est valable pendant <strong>48 heures</strong>.</p>
            
            <p style="color: #666; font-size: 14px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${invitationLink}</p>
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

    console.log("[send-invitation] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation_id: invitation.id,
        invitation_link: invitationLink,
        message: "Invitation envoyée avec succès",
        email_sent: true
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
