import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  role: "Admin" | "Formateur" | "Étudiant";
  establishment_id: string;
  created_by: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("send-invitation: Starting...");
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("send-invitation: No authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("send-invitation: Auth error", authError);
      return new Response(
        JSON.stringify({ error: "Utilisateur non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("send-invitation: User authenticated:", user.id);

    // Parse request body
    const body: InvitationRequest = await req.json();
    const { email, first_name, last_name, role, establishment_id, created_by } = body;

    console.log("send-invitation: Processing invitation for:", email, "role:", role);

    // Validate required fields
    if (!email || !role || !establishment_id) {
      return new Response(
        JSON.stringify({ error: "Champs requis manquants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      console.log("send-invitation: User already exists");
      return new Response(
        JSON.stringify({ error: "Un utilisateur avec cet email existe déjà" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation already exists and is pending
    const { data: existingInvitation } = await supabase
      .from("invitations")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .eq("establishment_id", establishment_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      console.log("send-invitation: Pending invitation already exists");
      return new Response(
        JSON.stringify({ error: "Une invitation en attente existe déjà pour cet email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get establishment info
    const { data: establishment, error: estError } = await supabase
      .from("establishments")
      .select("name")
      .eq("id", establishment_id)
      .single();

    if (estError || !establishment) {
      console.error("send-invitation: Establishment not found", estError);
      return new Response(
        JSON.stringify({ error: "Établissement non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase.rpc("generate_invitation_token");
    
    if (tokenError) {
      console.error("send-invitation: Token generation failed", tokenError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const invitationToken = tokenData;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .insert({
        email: email.toLowerCase(),
        first_name,
        last_name,
        role,
        establishment_id,
        created_by,
        token: invitationToken,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (inviteError) {
      console.error("send-invitation: Failed to create invitation", inviteError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de l'invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("send-invitation: Invitation created:", invitation.id);

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@resend.dev";

    if (!resendApiKey) {
      console.error("send-invitation: RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Configuration email manquante", invitation_created: true }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    // Build invitation URL - using the published domain
    const invitationUrl = `https://nectforme.lovable.app/accept-invitation?token=${invitationToken}`;

    const displayName = first_name ? `${first_name}${last_name ? ` ${last_name}` : ""}` : "Cher utilisateur";
    const roleLabel = role === "Étudiant" ? "étudiant" : role === "Formateur" ? "formateur" : "administrateur";

    // Send email
    const emailResponse = await resend.emails.send({
      from: `NectForMe <${fromEmail}>`,
      to: [email],
      subject: `Invitation à rejoindre ${establishment.name} sur NectForMe`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">NectForMe</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Plateforme de gestion de formation</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Bonjour ${displayName} !</h2>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Vous avez été invité(e) à rejoindre <strong>${establishment.name}</strong> en tant que <strong>${roleLabel}</strong>.
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Cliquez sur le bouton ci-dessous pour accepter cette invitation et créer votre compte :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accepter l'invitation
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Ce lien expirera dans 7 jours. Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
              </p>
            </div>
            
            <p style="color: #888; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
              © 2024 NectForMe. Tous droits réservés.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("send-invitation: Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation envoyée avec succès",
        invitation_id: invitation.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-invitation: Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur inattendue s'est produite" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
