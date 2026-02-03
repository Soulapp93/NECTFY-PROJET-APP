import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json; charset=utf-8",
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface RecipientPayload {
  type: "user" | "formation" | "all_instructors";
  ids?: string[];
}

function generateMessageEmailHtml(senderName: string, subject: string, recipientName: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#f4f4f7;"><table width="100%" style="padding:40px 20px;"><tr><td align="center"><table width="600" style="background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);padding:30px 40px;border-radius:12px 12px 0 0;"><h1 style="color:#fff;margin:0;font-size:24px;">NECTFORMA</h1></td></tr><tr><td style="padding:40px;"><p style="color:#374151;">Bonjour <strong>${recipientName}</strong>,</p><div style="background:#F3F4F6;border-left:4px solid #8B5CF6;padding:20px;border-radius:0 8px 8px 0;margin-bottom:24px;"><h2 style="color:#1F2937;font-size:18px;margin:0 0 12px;">📩 Nouveau message reçu</h2><p style="color:#4B5563;margin:0;"><strong>${senderName}</strong> vous a envoyé: "${subject}".</p></div><table width="100%"><tr><td align="center" style="padding:20px 0;"><a href="https://nectforme.lovable.app/messagerie" style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;">Lire le message</a></td></tr></table></td></tr><tr><td style="background:#F9FAFB;padding:24px 40px;border-radius:0 0 12px 12px;border-top:1px solid #E5E7EB;text-align:center;"><p style="color:#6B7280;font-size:13px;margin:0;">© ${new Date().getFullYear()} NECTFORMA</p></td></tr></table></td></tr></table></body></html>`;
}

async function sendEmailNotification(brevoApiKey: string, toEmail: string, toName: string, senderName: string, messageSubject: string): Promise<void> {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: { "accept": "application/json", "api-key": brevoApiKey, "content-type": "application/json" },
      body: JSON.stringify({ 
        sender: { name: "NECTFORMA", email: "noreply@nectforma.com" }, 
        to: [{ email: toEmail, name: toName }], 
        subject: `📩 Nouveau message de ${senderName} - NECTFORMA`, 
        htmlContent: generateMessageEmailHtml(senderName, messageSubject, toName), 
        tags: ["notification", "message", "scheduled"] 
      }),
    });
    
    if (response.ok) {
      console.log(`Email notification sent successfully to ${toEmail}`);
    } else {
      const errorText = await response.text();
      console.error(`Failed to send email to ${toEmail}: ${errorText}`);
    }
  } catch (error) { 
    console.error("Error sending email:", error); 
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const now = new Date();
  console.log(`[${now.toISOString()}] Processing scheduled messages...`);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");

    // Find all scheduled messages that are due (scheduled_for <= now)
    const nowIso = now.toISOString();
    console.log(`Looking for messages with scheduled_for <= ${nowIso}`);
    
    const { data: scheduledMessages, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("*")
      .not("scheduled_for", "is", null)
      .not("scheduled_recipients", "is", null)
      .lte("scheduled_for", nowIso)
      .eq("is_draft", false);

    if (fetchError) {
      console.error("Error fetching scheduled messages:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500, headers: jsonHeaders });
    }

    if (!scheduledMessages || scheduledMessages.length === 0) {
      console.log("No scheduled messages to process");
      return new Response(JSON.stringify({ success: true, processed: 0 }), { status: 200, headers: jsonHeaders });
    }

    console.log(`Found ${scheduledMessages.length} scheduled messages to process`);

    let processedCount = 0;
    let errorCount = 0;

    for (const message of scheduledMessages) {
      try {
        console.log(`Processing message ${message.id} (scheduled_for: ${message.scheduled_for})...`);
        
        const recipients = message.scheduled_recipients as RecipientPayload;
        const senderId = message.sender_id;

        // Get sender info for email notifications
        const { data: senderUser } = await supabaseAdmin
          .from("users")
          .select("first_name, last_name, establishment_id")
          .eq("id", senderId)
          .maybeSingle();

        let senderName = senderUser ? `${senderUser.first_name} ${senderUser.last_name}` : "Un utilisateur";
        let establishmentId = senderUser?.establishment_id;
        
        if (!establishmentId) {
          const { data: senderTutor } = await supabaseAdmin
            .from("tutors")
            .select("first_name, last_name, establishment_id")
            .eq("id", senderId)
            .maybeSingle();
          establishmentId = senderTutor?.establishment_id;
          if (senderTutor) {
            senderName = `${senderTutor.first_name} ${senderTutor.last_name}`;
          }
        }

        // Build recipients list
        const recipientRows: Array<{ message_id: string; recipient_id: string; recipient_type: string; is_read: boolean; read_at: string | null }> = [];
        const emailRecipients: Array<{ email: string; name: string }> = [];

        const addUserRecipients = async (userIds: string[]) => {
          const unique = Array.from(new Set(userIds)).filter((id) => id && id !== senderId);
          for (const rid of unique) {
            recipientRows.push({
              message_id: message.id,
              recipient_id: rid,
              recipient_type: "user",
              is_read: false,
              read_at: null,
            });
            
            // Get user info for email
            const { data: u } = await supabaseAdmin
              .from("users")
              .select("email, first_name, last_name")
              .eq("id", rid)
              .maybeSingle();
            
            if (u) {
              emailRecipients.push({ email: u.email, name: `${u.first_name} ${u.last_name}` });
            }
          }
        };

        if (recipients.type === "all_instructors" && establishmentId) {
          const { data: instructors } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("establishment_id", establishmentId)
            .eq("role", "Formateur");

          console.log(`Found ${(instructors || []).length} instructors`);
          await addUserRecipients((instructors || []).map((i: any) => i.id as string));
        } else if (recipients.type === "formation" && recipients.ids?.length) {
          const { data: assignments } = await supabaseAdmin
            .from("user_formation_assignments")
            .select("user_id")
            .in("formation_id", recipients.ids);

          if (assignments && assignments.length > 0) {
            const assignedUserIds = assignments.map((a: any) => a.user_id as string);
            
            const { data: students } = await supabaseAdmin
              .from("users")
              .select("id")
              .in("id", assignedUserIds)
              .eq("role", "Étudiant");

            console.log(`Found ${(students || []).length} students`);
            await addUserRecipients((students || []).map((s: any) => s.id as string));
          }
        } else if (recipients.type === "user" && recipients.ids?.length) {
          await addUserRecipients(recipients.ids);
        }

        // Insert recipients
        if (recipientRows.length > 0) {
          const { error: insertError } = await supabaseAdmin
            .from("message_recipients")
            .insert(recipientRows);

          if (insertError) {
            console.error(`Error inserting recipients for message ${message.id}:`, insertError);
            errorCount++;
            continue;
          }
          console.log(`Created ${recipientRows.length} recipients for message ${message.id}`);
        }

        // Clear scheduled_recipients to mark as processed
        const { error: updateError } = await supabaseAdmin
          .from("messages")
          .update({ scheduled_recipients: null })
          .eq("id", message.id);

        if (updateError) {
          console.error(`Error updating message ${message.id}:`, updateError);
          errorCount++;
          continue;
        }

        // Send email notifications
        if (brevoApiKey && emailRecipients.length > 0) {
          console.log(`Sending ${emailRecipients.length} email notifications for message ${message.id}...`);
          await Promise.all(
            emailRecipients.map(r => sendEmailNotification(brevoApiKey, r.email, r.name, senderName, message.subject))
          );
        }

        processedCount++;
        console.log(`Successfully processed message ${message.id}`);
      } catch (err) {
        console.error(`Error processing message ${message.id}:`, err);
        errorCount++;
      }
    }

    console.log(`Completed: processed ${processedCount} messages, ${errorCount} errors`);
    return new Response(
      JSON.stringify({ success: true, processed: processedCount, errors: errorCount }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: jsonHeaders });
  }
});
