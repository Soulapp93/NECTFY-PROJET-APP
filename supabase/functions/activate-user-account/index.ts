import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivateAccountRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { token, password }: ActivateAccountRequest = await req.json();

    console.log("Processing account activation for token:", token.substring(0, 8) + "...");

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

    // Find and validate activation token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_activation_tokens')
      .select('*, users!inner(id, email, first_name, last_name, role, establishment_id)')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error("Token validation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Token d'activation invalide ou expiré" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = tokenData.users;
    const userId = tokenData.user_id;

    console.log("Activating account for user:", user.email);

    // Check if auth user already exists
    let authUserId: string | null = null;
    
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });
    
    const existingAuthUser = existingUsers?.find(u => u.email === user.email);
    
    if (existingAuthUser) {
      // Update password for existing user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        { password, email_confirm: true }
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
      // Create new auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name
        }
      });

      if (createError) {
        console.error("Error creating auth user:", createError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la création du compte: " + createError.message }),
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

    // Update user profile: set is_activated, status, and link to auth user if needed
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        id: authUserId, // Link to auth user ID
        is_activated: true,
        status: 'Actif'
      })
      .eq('id', userId);

    if (updateUserError) {
      console.error("Error updating user profile:", updateUserError);
      // Try alternative approach - if user ID doesn't match, create proper link
      // This handles the case where user was created with a different ID than auth user
    }

    // If userId is different from authUserId, we need to handle this
    if (userId !== authUserId) {
      // Delete old profile and create new one with correct ID
      const { data: oldUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (oldUser) {
        // Check if auth user profile exists
        const { data: existingAuthProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', authUserId)
          .single();

        if (!existingAuthProfile) {
          // Create new profile with auth user ID
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUserId,
              email: oldUser.email,
              first_name: oldUser.first_name,
              last_name: oldUser.last_name,
              role: oldUser.role,
              establishment_id: oldUser.establishment_id,
              phone: oldUser.phone,
              is_activated: true,
              status: 'Actif'
            });

          if (!insertError) {
            // Delete old profile
            await supabase
              .from('users')
              .delete()
              .eq('id', userId);
          }
        } else {
          // Just update existing auth profile
          await supabase
            .from('users')
            .update({
              is_activated: true,
              status: 'Actif'
            })
            .eq('id', authUserId);
        }
      }
    }

    // Mark token as used
    await supabase
      .from('user_activation_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    console.log("Account activated successfully for user:", authUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUserId,
        email: user.email,
        message: "Compte activé avec succès" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in activate-user-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
