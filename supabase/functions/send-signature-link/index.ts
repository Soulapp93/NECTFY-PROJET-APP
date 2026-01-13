import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { attendanceSheetId, studentIds } = await req.json();

    if (!attendanceSheetId || !studentIds || !Array.isArray(studentIds)) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les informations de la feuille d'émargement
    const { data: sheet, error: sheetError } = await supabase
      .from("attendance_sheets")
      .select(`
        *,
        formations(title, level),
        users:instructor_id(id, email, first_name, last_name)
      `)
      .eq("id", attendanceSheetId)
      .single();

    if (sheetError || !sheet) {
      console.error("Error fetching attendance sheet:", sheetError);
      return new Response(
        JSON.stringify({ error: "Attendance sheet not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construire le lien de signature
    const appUrl = Deno.env.get("APP_URL") || "https://nectforma.com";
    const signatureLink = `${appUrl}/emargement/signer/${sheet.signature_link_token}`;

    const notificationTitle = "Lien d'émargement - " + sheet.formations.title;
    const sessionDate = new Date(sheet.date).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const notificationMessage = `Un lien d'émargement a été envoyé pour la session "${sheet.formations.title}" du ${sessionDate} (${sheet.start_time.substring(0, 5)} - ${sheet.end_time.substring(0, 5)}). Connectez-vous à NECTFORMA pour signer votre présence.`;

    // Créer les notifications pour chaque étudiant
    const notifications = studentIds.map((studentId: string) => ({
      user_id: studentId,
      type: "attendance",
      title: notificationTitle,
      message: notificationMessage,
      metadata: {
        attendance_sheet_id: attendanceSheetId,
        signature_link: signatureLink,
        expires_at: sheet.signature_link_expires_at
      }
    }));

    // Ajouter notification pour le formateur si présent
    if (sheet.instructor_id && sheet.users) {
      notifications.push({
        user_id: sheet.instructor_id,
        type: "attendance",
        title: notificationTitle,
        message: `Lien d'émargement envoyé pour votre session "${sheet.formations.title}" du ${sessionDate}. Les étudiants ont été notifiés.`,
        metadata: {
          attendance_sheet_id: attendanceSheetId,
          signature_link: signatureLink,
          expires_at: sheet.signature_link_expires_at
        }
      });
    }

    // Insérer les notifications
    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Error creating notifications:", notifError);
      return new Response(
        JSON.stringify({ error: "Failed to send notifications" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer un message dans la messagerie
    // Récupérer un admin de l'établissement pour envoyer le message
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("establishment_id", sheet.formation_id ? (await supabase.from("formations").select("establishment_id").eq("id", sheet.formation_id).single()).data?.establishment_id : null)
      .in("role", ["Admin", "AdminPrincipal"])
      .limit(1)
      .single();

    // Fallback: utiliser l'instructeur comme expéditeur si pas d'admin trouvé
    const senderId = adminUser?.id || sheet.instructor_id;

    if (senderId) {
      // Message pour étudiants (sans le lien direct - le lien est dans les métadonnées/notifications)
      const messageContent = `Bonjour,\n\nUn lien d'émargement est disponible pour la session suivante :\n\n📚 Formation : ${sheet.formations.title}\n📅 Date : ${sessionDate}\n🕐 Horaire : ${sheet.start_time.substring(0, 5)} - ${sheet.end_time.substring(0, 5)}\n\nVeuillez vous connecter à votre espace NECTFORMA pour signer votre présence.\n\n⏰ Vous avez 24 heures pour signer.\n\nCordialement,\nL'administration`;
      
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          sender_id: senderId,
          subject: notificationTitle,
          content: messageContent,
          is_draft: false,
          attachment_count: 0
        })
        .select()
        .single();

      if (!messageError && message) {
        // Créer les destinataires du message (étudiants + formateur)
        const allRecipientIds = [...studentIds];
        if (sheet.instructor_id && sheet.instructor_id !== senderId) {
          allRecipientIds.push(sheet.instructor_id);
        }
        
        const recipients = allRecipientIds.map((recipientId: string) => ({
          message_id: message.id,
          recipient_id: recipientId,
          recipient_type: 'user'
        }));

        await supabase.from("message_recipients").insert(recipients);
      }
    } else {
      console.warn("No sender found for message, skipping message creation");
    }

    // Récupérer les emails pour l'envoi d'email Gmail
    const allUserIds = [...studentIds];
    if (sheet.instructor_id) {
      allUserIds.push(sheet.instructor_id);
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("email")
      .in("id", allUserIds);

    if (!usersError && users && users.length > 0) {
      const userEmails = users.map(u => u.email);
      
      // Appeler l'edge function pour envoyer les emails
      // NOTE: L'email ne contient PAS le lien direct, seulement une notification
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            userEmails,
            title: notificationTitle,
            message: "Un lien d'émargement est disponible pour une session de formation. Connectez-vous à votre espace NECTFORMA pour signer votre présence.",
            type: "attendance"
          }
        });
        console.log(`Gmail notifications sent to ${userEmails.length} users (students + instructor)`);
      } catch (emailError) {
        console.error("Failed to send Gmail notifications:", emailError);
        // Ne pas bloquer si l'envoi d'email échoue
      }
    }

    console.log(`Sent signature link to ${studentIds.length} students and instructor for attendance sheet ${attendanceSheetId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${studentIds.length} students${sheet.instructor_id ? ' and instructor' : ''}`,
        link: signatureLink
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-signature-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});