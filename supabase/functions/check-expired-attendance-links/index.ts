import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Checking for expired attendance links...");

    // Trouver toutes les feuilles d'émargement avec des liens expirés
    // et qui ne sont pas encore en "En attente de validation" ou "Validé"
    const { data: expiredSheets, error: fetchError } = await supabase
      .from("attendance_sheets")
      .select(`
        id,
        title,
        date,
        formation_id,
        signature_link_token,
        signature_link_expires_at,
        status,
        formations(title)
      `)
      .not("signature_link_token", "is", null)
      .not("signature_link_expires_at", "is", null)
      .lt("signature_link_expires_at", new Date().toISOString())
      .in("status", ["En attente", "En cours"])
      .order("signature_link_expires_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching expired sheets:", fetchError);
      throw fetchError;
    }

    if (!expiredSheets || expiredSheets.length === 0) {
      console.log("No expired attendance sheets found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired sheets to process",
          updated: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${expiredSheets.length} expired attendance sheets`);

    // Mettre à jour le statut de chaque feuille
    const updatePromises = expiredSheets.map(async (sheet) => {
      const { error: updateError } = await supabase
        .from("attendance_sheets")
        .update({
          status: "En attente de validation",
          is_open_for_signing: false,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", sheet.id);

      if (updateError) {
        console.error(`Error updating sheet ${sheet.id}:`, updateError);
        return { id: sheet.id, success: false, error: updateError };
      }

      // Récupérer les administrateurs de l'établissement
      const { data: formation } = await supabase
        .from("formations")
        .select("establishment_id")
        .eq("id", sheet.formation_id)
        .single();

      if (formation) {
        const { data: admins } = await supabase
          .from("users")
          .select("id, email")
          .eq("establishment_id", formation.establishment_id)
          .in("role", ["Admin", "Super Administrateur"]);

        // Créer des notifications pour les administrateurs
        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            user_id: admin.id,
            type: "attendance",
            title: "Feuille d'émargement à valider",
            message: `La feuille d'émargement "${sheet.formations.title}" du ${new Date(sheet.date).toLocaleDateString('fr-FR')} est prête pour validation.`,
            metadata: {
              attendance_sheet_id: sheet.id,
              formation_id: sheet.formation_id,
              date: sheet.date
            }
          }));

          const { error: notifError } = await supabase
            .from("notifications")
            .insert(notifications);

          if (notifError) {
            console.error(`Error creating notifications for sheet ${sheet.id}:`, notifError);
          }

          // Envoyer des emails Gmail aux admins
          try {
            const adminEmails = admins.map(admin => admin.email);
            await supabase.functions.invoke("send-notification-email", {
              body: {
                userEmails: adminEmails,
                title: "Feuille d'émargement à valider",
                message: `La feuille d'émargement "${sheet.formations.title}" du ${new Date(sheet.date).toLocaleDateString('fr-FR')} est prête pour validation. Veuillez vous connecter à votre espace Nectfy.`,
                type: "attendance"
              }
            });
            console.log(`Gmail notifications sent for sheet ${sheet.id}`);
          } catch (emailError) {
            console.error(`Failed to send Gmail notifications for sheet ${sheet.id}:`, emailError);
          }
        }
      }

      console.log(`Updated sheet ${sheet.id} to "En attente de validation"`);
      return { id: sheet.id, success: true };
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Successfully updated ${successCount}/${expiredSheets.length} sheets`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${successCount} expired attendance sheets`,
        updated: successCount,
        total: expiredSheets.length,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-expired-attendance-links:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
