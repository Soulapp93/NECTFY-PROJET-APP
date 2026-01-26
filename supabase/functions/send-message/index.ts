import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub as string;
    console.log("Authenticated user:", userId);

    // Service role client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: SendMessagePayload = await req.json();
    const { subject, content, is_draft, scheduled_for, recipients, attachments } = payload;

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: "subject and content are required" }),
        { status: 400, headers: corsHeaders }
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
      return new Response(JSON.stringify({ error: messageError.message }), { status: 500, headers: corsHeaders });
    }

    console.log("Message created:", message.id);

    // 2) Build recipients list
    const recipientRows: Array<{ message_id: string; recipient_id?: string; recipient_type: string }> = [];

    if (recipients.type === "all_instructors") {
      recipientRows.push({ message_id: message.id, recipient_type: "all_instructors" });
    } else if (recipients.type === "formation" && recipients.ids?.length) {
      for (const formationId of recipients.ids) {
        recipientRows.push({ message_id: message.id, recipient_id: formationId, recipient_type: "formation" });
      }
    } else if (recipients.type === "user" && recipients.ids?.length) {
      for (const recipientId of recipients.ids) {
        recipientRows.push({ message_id: message.id, recipient_id: recipientId, recipient_type: "user" });
      }
    }

    if (recipientRows.length > 0) {
      const { error: recipientError } = await supabaseAdmin.from("message_recipients").insert(recipientRows);
      if (recipientError) {
        console.error("Insert recipients error:", recipientError);
        // Rollback: delete the message
        await supabaseAdmin.from("messages").delete().eq("id", message.id);
        return new Response(JSON.stringify({ error: recipientError.message }), { status: 500, headers: corsHeaders });
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
        return new Response(JSON.stringify({ error: attachError.message }), { status: 500, headers: corsHeaders });
      }
      console.log("Attachments created:", attachmentRows.length);
    }

    return new Response(JSON.stringify({ success: true, message }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
