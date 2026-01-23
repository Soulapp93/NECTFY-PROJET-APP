import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateActivationTokenRequest {
  token: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: ValidateActivationTokenRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[validate-activation-token] 🔎 Validating token:", token.substring(0, 8) + "...");

    const nowIso = new Date().toISOString();
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("user_activation_tokens")
      .select(
        `
        user_id,
        token,
        expires_at,
        used_at,
        users!inner(
          id,
          email,
          first_name,
          last_name,
          role,
          establishment_id,
          establishments!inner(name)
        )
      `,
      )
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .single();

    if (tokenError || !tokenData) {
      console.warn("[validate-activation-token] ❌ Invalid/expired token", { tokenError: tokenError?.message });
      return new Response(
        JSON.stringify({ error: "Token d'activation invalide ou expiré" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const user = tokenData.users as any;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          establishment_id: user.establishment_id,
          establishment_name: user.establishments?.name || "NECTFORMA",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[validate-activation-token] ❌ Critical error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
