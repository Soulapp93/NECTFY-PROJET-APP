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

interface RecipientPayload {
  type: "user" | "formation" | "all_instructors";
  ids?: string[];
}

interface AttachmentPayload {
  file_name: string;
  file_url: string;
  file_size?: number;
  content_type?: string;
}

interface SendMessagePayload {
  subject: string;
  content: string;
  is_draft?: boolean;
  scheduled_for?: string;
  recipients: RecipientPayload;
  attachments?: AttachmentPayload[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }

    // User client (to verify JWT and get user info)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      console.error("Claims error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }

    const userId = claimsData.claims.sub as string;
    console.log("Authenticated user:", userId);

    // Service role client for privileged writes (bypasses RLS).
    // The DB trigger function is configured to allow service_role inserts as long
    // as sender_id is explicitly provided.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: SendMessagePayload = await req.json();
    const { subject, content, is_draft, scheduled_for, recipients, attachments } = payload;

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: "subject and content are required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // 1) Insert message
    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: userId,
        subject,
        content,
        is_draft: is_draft ?? false,
        scheduled_for: scheduled_for ?? null,
        attachment_count: attachments?.length ?? 0,
      })
      .select()
      .single();

    if (messageError) {
      console.error("Insert message error:", messageError);
      return new Response(JSON.stringify({ error: messageError.message }), { status: 500, headers: jsonHeaders });
    }

    console.log("Message created:", message.id);

    // Resolve sender establishment to ensure group sends stay tenant-isolated.
    const resolveSenderEstablishmentId = async (): Promise<string | null> => {
      // Primary path: users table
      const { data: u, error: uErr } = await supabaseAdmin
        .from("users")
        .select("establishment_id")
        .eq("id", userId)
        .maybeSingle();
      if (uErr) {
        console.error("Resolve sender establishment (users) error:", uErr);
      }
      if (u?.establishment_id) return u.establishment_id as string;

      // Fallback path: tutors table
      const { data: t, error: tErr } = await supabaseAdmin
        .from("tutors")
        .select("establishment_id")
        .eq("id", userId)
        .maybeSingle();
      if (tErr) {
        console.error("Resolve sender establishment (tutors) error:", tErr);
      }
      return (t?.establishment_id as string) ?? null;
    };

    // 2) Build recipients list
    const recipientRows: Array<{ message_id: string; recipient_id?: string; recipient_type: string; is_read?: boolean; read_at?: string | null }> = [];

    // Always add a "sender copy" so the sender can reliably see the message in "Envoyés"
    // even if their access relies on recipient-based logic.
    recipientRows.push({
      message_id: message.id,
      recipient_id: userId,
      recipient_type: "user",
      is_read: true,
      read_at: new Date().toISOString(),
    });

    const addUserRecipients = (userIds: string[]) => {
      const unique = Array.from(new Set(userIds)).filter((id) => id && id !== userId);
      for (const rid of unique) {
        recipientRows.push({
          message_id: message.id,
          recipient_id: rid,
          recipient_type: "user",
          is_read: false,
          read_at: null,
        });
      }
    };

    if (recipients.type === "all_instructors") {
      const establishmentId = await resolveSenderEstablishmentId();

      if (!establishmentId) {
        console.error("Could not resolve establishment for sender; cannot target instructors safely");
        return new Response(
          JSON.stringify({ error: "Impossible de résoudre l'établissement de l'expéditeur" }),
          { status: 500, headers: jsonHeaders }
        );
      }

      const { data: instructors, error: instructorsErr } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("establishment_id", establishmentId)
        .eq("role", "Formateur");

      if (instructorsErr) {
        console.error("Select instructors error:", instructorsErr);
        return new Response(JSON.stringify({ error: instructorsErr.message }), { status: 500, headers: jsonHeaders });
      }

      addUserRecipients((instructors || []).map((i: any) => i.id as string));
    } else if (recipients.type === "formation" && recipients.ids?.length) {
      // Expand formation -> assigned users
      const { data: assignments, error: assignErr } = await supabaseAdmin
        .from("user_formation_assignments")
        .select("user_id")
        .in("formation_id", recipients.ids);

      if (assignErr) {
        console.error("Select formation assignments error:", assignErr);
        return new Response(JSON.stringify({ error: assignErr.message }), { status: 500, headers: jsonHeaders });
      }

      addUserRecipients((assignments || []).map((a: any) => a.user_id as string));
    } else if (recipients.type === "user" && recipients.ids?.length) {
      addUserRecipients(recipients.ids);
    }

    if (recipientRows.length > 0) {
      const { error: recipientError } = await supabaseAdmin.from("message_recipients").insert(recipientRows);
      if (recipientError) {
        console.error("Insert recipients error:", recipientError);
        // Rollback: delete the message
        await supabaseAdmin.from("messages").delete().eq("id", message.id);
        return new Response(JSON.stringify({ error: recipientError.message }), { status: 500, headers: jsonHeaders });
      }
      console.log("Recipients created:", recipientRows.length);
    }

    // 3) Insert attachments
    if (attachments && attachments.length > 0) {
      const attachmentRows = attachments.map((att) => ({
        message_id: message.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_size: att.file_size ?? null,
        content_type: att.content_type ?? null,
      }));

      const { error: attachError } = await supabaseAdmin.from("message_attachments").insert(attachmentRows);
      if (attachError) {
        console.error("Insert attachments error:", attachError);
        // Rollback
        await supabaseAdmin.from("message_recipients").delete().eq("message_id", message.id);
        await supabaseAdmin.from("messages").delete().eq("id", message.id);
        return new Response(JSON.stringify({ error: attachError.message }), { status: 500, headers: jsonHeaders });
      }
      console.log("Attachments created:", attachmentRows.length);
    }

    return new Response(JSON.stringify({ success: true, message }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: jsonHeaders });
  }
});
