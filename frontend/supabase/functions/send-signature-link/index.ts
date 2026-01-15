import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@nectforma.com";
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
    }

    // Créer un message dans la messagerie
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("establishment_id", sheet.formation_id ? (await supabase.from("formations").select("establishment_id").eq("id", sheet.formation_id).single()).data?.establishment_id : null)
      .in("role", ["Admin", "AdminPrincipal"])
      .limit(1)
      .single();

    const senderId = adminUser?.id || sheet.instructor_id;

    if (senderId) {
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
    }

    // Get student emails for sending
    const { data: students } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .in("id", studentIds);

    const emailResults = {
      sent: 0,
      failed: 0,
      details: [] as any[]
    };

    // Send emails to students
    if (students && students.length > 0) {
      for (const student of students) {
        try {
          await resend.emails.send({
            from: `NECTFORMA <${fromEmail}>`,
            to: [student.email],
            subject: `NECTFORMA - ${notificationTitle}`,
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
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Émargement</p>
                </div>
                
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                  <h2 style="color: #333; margin-top: 0;">Bonjour ${student.first_name},</h2>
                  
                  <p>Un lien d'émargement est disponible pour la session suivante :</p>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>📚 Formation :</strong> ${sheet.formations.title}</p>
                    <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${sessionDate}</p>
                    <p style="margin: 5px 0;"><strong>🕐 Horaire :</strong> ${sheet.start_time.substring(0, 5)} - ${sheet.end_time.substring(0, 5)}</p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${signatureLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                      Signer ma présence
                    </a>
                  </div>
                  
                  <p style="color: #e74c3c; font-size: 14px; text-align: center;">⏰ Vous avez 24 heures pour signer.</p>
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
          emailResults.sent++;
          emailResults.details.push({ email: student.email, success: true });
        } catch (error: any) {
          emailResults.failed++;
          emailResults.details.push({ email: student.email, success: false, error: error.message });
          console.error(`Failed to send email to ${student.email}:`, error);
        }
      }
    }

    // Send email to instructor if present
    if (sheet.instructor_id && sheet.users) {
      try {
        await resend.emails.send({
          from: `NECTFORMA <${fromEmail}>`,
          to: [sheet.users.email],
          subject: `NECTFORMA - ${notificationTitle}`,
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
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Émargement</p>
              </div>
              
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                <h2 style="color: #333; margin-top: 0;">Bonjour ${sheet.users.first_name},</h2>
                
                <p>Le lien d'émargement a été envoyé aux étudiants pour votre session :</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>📚 Formation :</strong> ${sheet.formations.title}</p>
                  <p style="margin: 5px 0;"><strong>📅 Date :</strong> ${sessionDate}</p>
                  <p style="margin: 5px 0;"><strong>🕐 Horaire :</strong> ${sheet.start_time.substring(0, 5)} - ${sheet.end_time.substring(0, 5)}</p>
                  <p style="margin: 5px 0;"><strong>👥 Étudiants notifiés :</strong> ${studentIds.length}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${signatureLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Accéder à l'émargement
                  </a>
                </div>
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
        emailResults.sent++;
      } catch (error: any) {
        emailResults.failed++;
        console.error(`Failed to send email to instructor ${sheet.users.email}:`, error);
      }
    }

    console.log(`Sent signature link notifications to ${studentIds.length} students for attendance sheet ${attendanceSheetId}`);
    console.log(`[send-signature-link] Email results: ${emailResults.sent} sent, ${emailResults.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications et emails envoyés à ${studentIds.length} étudiant(s)${sheet.instructor_id ? ' et au formateur' : ''}`,
        link: signatureLink,
        email_sent: true,
        emailResults
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
