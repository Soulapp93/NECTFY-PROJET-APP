import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const appUrl = Deno.env.get("APP_URL") || "https://nectforma.lovable.app";
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

    // ENVOI DES EMAILS VIA RESEND
    // Récupérer les emails des étudiants et formateur
    const allUserIds = [...studentIds];
    if (sheet.instructor_id) {
      allUserIds.push(sheet.instructor_id);
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .in("id", allUserIds);

    const emailResults: { email: string; success: boolean; error?: string }[] = [];

    if (!usersError && users && users.length > 0) {
      console.log(`Sending signature link emails to ${users.length} users via Resend`);

      for (const user of users) {
        try {
          const isInstructor = user.id === sheet.instructor_id;
          const firstName = user.first_name || 'Utilisateur';
          
          const emailResponse = await resend.emails.send({
            from: "NECTFORMA <noreply@nectforma.com>",
            to: [user.email],
            subject: `NECTFORMA - ${notificationTitle}`,
            html: `
              <!DOCTYPE html>
              <html lang="fr">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lien d'émargement - NECTFORMA</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
                  <tr>
                    <td align="center" style="padding: 40px 20px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
                        
                        <!-- Header with gradient -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 40px 40px 30px; text-align: center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                              <tr>
                                <td style="background-color: #ffffff; width: 56px; height: 56px; border-radius: 12px; text-align: center; vertical-align: middle;">
                                  <span style="color: #8B5CF6; font-size: 20px; font-weight: bold; line-height: 56px;">NF</span>
                                </td>
                                <td style="padding-left: 16px;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">NECTFORMA</h1>
                                </td>
                              </tr>
                            </table>
                            <p style="margin: 16px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Plateforme de gestion de formation</p>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px;">
                            <h2 style="margin: 0 0 24px; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                              📝 Lien d'émargement disponible
                            </h2>
                            
                            <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                              Bonjour <strong>${firstName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                              ${isInstructor 
                                ? `Un lien d'émargement a été généré pour votre session. Les étudiants ont été notifiés.`
                                : `Un lien d'émargement est disponible pour votre session de formation.`
                              }
                            </p>
                            
                            <!-- Session details -->
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #6b7280; font-size: 14px;">📚 Formation :</span>
                                    <strong style="color: #1f2937; font-size: 14px; margin-left: 8px;">${sheet.formations.title}</strong>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #6b7280; font-size: 14px;">📅 Date :</span>
                                    <strong style="color: #1f2937; font-size: 14px; margin-left: 8px;">${sessionDate}</strong>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #6b7280; font-size: 14px;">🕐 Horaire :</span>
                                    <strong style="color: #1f2937; font-size: 14px; margin-left: 8px;">${sheet.start_time.substring(0, 5)} - ${sheet.end_time.substring(0, 5)}</strong>
                                  </td>
                                </tr>
                                ${sheet.room ? `
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #6b7280; font-size: 14px;">📍 Salle :</span>
                                    <strong style="color: #1f2937; font-size: 14px; margin-left: 8px;">${sheet.room}</strong>
                                  </td>
                                </tr>
                                ` : ''}
                              </table>
                            </div>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                              <tr>
                                <td align="center" style="padding: 16px 0;">
                                  <a href="${signatureLink}" 
                                     style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.4);">
                                    ✍️ Signer ma présence
                                  </a>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Warning -->
                            <div style="margin-top: 24px; padding: 16px; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 8px; border-left: 4px solid #F59E0B;">
                              <p style="margin: 0; color: #92400E; font-size: 14px;">
                                <strong>⏰ Important :</strong> Ce lien expire dans 24 heures. Pensez à signer votre présence avant l'expiration.
                              </p>
                            </div>
                            
                            <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                              </p>
                              <p style="margin: 8px 0 0; word-break: break-all;">
                                <a href="${signatureLink}" style="color: #8B5CF6; font-size: 13px; text-decoration: underline;">${signatureLink}</a>
                              </p>
                            </div>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                              © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                              Cet email a été envoyé à ${user.email}
                            </p>
                          </td>
                        </tr>
                        
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          });

          if (emailResponse.error) {
            console.error(`Resend error for ${user.email}:`, emailResponse.error);
            emailResults.push({ email: user.email, success: false, error: emailResponse.error.message });
          } else {
            console.log(`Email sent successfully to ${user.email}:`, emailResponse.data?.id);
            emailResults.push({ email: user.email, success: true });
          }
        } catch (emailError: any) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          emailResults.push({ email: user.email, success: false, error: emailError.message });
        }
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    const failCount = emailResults.filter(r => !r.success).length;

    console.log(`Sent signature link to ${studentIds.length} students and instructor for attendance sheet ${attendanceSheetId}`);
    console.log(`Email results: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${studentIds.length} students${sheet.instructor_id ? ' and instructor' : ''}`,
        link: signatureLink,
        emailResults: {
          sent: successCount,
          failed: failCount,
          details: emailResults
        }
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
