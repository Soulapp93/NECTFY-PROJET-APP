import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  token: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { token, password, first_name, last_name }: AcceptInvitationRequest = await req.json();

    console.log("Processing invitation acceptance for token:", token.substring(0, 8) + "...");

    // Validate required fields
    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: "Token et mot de passe requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate invitation token
    const { data: invitationData, error: validationError } = await supabase
      .rpc('validate_invitation_token', { token_param: token });

    if (validationError) {
      console.error("Token validation error:", validationError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la validation du token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!invitationData || invitationData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Token d'invitation invalide" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const invitation = invitationData[0];

    if (!invitation.is_valid) {
      return new Response(
        JSON.stringify({ error: invitation.error_message || "Invitation invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use provided names or fall back to invitation names
    const finalFirstName = first_name || invitation.first_name || '';
    const finalLastName = last_name || invitation.last_name || '';

    // Check if auth user already exists with this email
    let authUserId: string | null = null;
    
    // Try to find existing auth user
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    const existingAuthUser = existingUsers?.find(u => u.email === invitation.email);
    
    if (existingAuthUser) {
      // Update password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        { password }
      );
      
      if (updateError) {
        console.error("Error updating existing user:", updateError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la mise à jour du compte" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      authUserId = existingAuthUser.id;
    } else {
      // Create new auth user WITHOUT establishment_id to avoid trigger conflict
      // The trigger handle_new_user_signup only creates a user if establishment_id is present
      // We skip it here and create the user profile manually below
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: finalFirstName,
          last_name: finalLastName
          // NOTE: NOT including establishment_id to prevent trigger from creating duplicate
        }
      });

      if (createError) {
        console.error("Error creating auth user:", createError);
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de la création du compte: " + createError.message,
            code: (createError as any).code,
            status: (createError as any).status
          }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      authUserId = newUser.user.id;
    }

    if (!authUserId) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du compte utilisateur" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .single();

    if (!existingProfile) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: invitation.email,
          first_name: finalFirstName,
          last_name: finalLastName,
          role: invitation.role,
          establishment_id: invitation.establishment_id,
          status: 'Actif',
          is_activated: true
        });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        // Rollback: delete auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUserId);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la création du profil utilisateur" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // Update existing profile
      await supabase
        .from('users')
        .update({
          first_name: finalFirstName,
          last_name: finalLastName,
          role: invitation.role,
          status: 'Actif',
          is_activated: true
        })
        .eq('id', authUserId);
    }

    // Mark invitation as accepted
    const { data: accepted } = await supabase
      .rpc('accept_invitation', { 
        token_param: token, 
        user_id_param: authUserId 
      });

    if (!accepted) {
      console.warn("Could not mark invitation as accepted");
    }

    console.log("Invitation accepted successfully for user:", authUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUserId,
        message: "Compte créé avec succès" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in accept-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
