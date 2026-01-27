import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSignatureLinkRequest {
  attendanceSheetId: string;
  studentIds: string[];
  mode?: 'default' | 'fallback';
  retryFailedOnly?: boolean;
  baseUrl?: string; // Allow client to pass current origin for preview environments
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateTokenHex(byteLen = 32) {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[send-signature-link] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valider le token JWT en utilisant getUser avec le service_role client
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      console.warn('[send-signature-link] Invalid JWT:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const senderId = userData.user.id;
    console.log('[send-signature-link] Authenticated sender:', senderId);

    // Parser le body
    const {
      attendanceSheetId,
      studentIds,
      mode = 'default',
      retryFailedOnly = false,
      baseUrl: clientBaseUrl,
    }: SendSignatureLinkRequest = await req.json();

    if (!attendanceSheetId || !studentIds || studentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'attendanceSheetId et studentIds sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(
      `[send-signature-link] mode=${mode} retryFailedOnly=${retryFailedOnly} sending to ${studentIds.length} students for sheet ${attendanceSheetId}`,
    );

    // Récupérer les infos de la feuille d'émargement
    const { data: sheet, error: sheetError } = await supabase
      .from('attendance_sheets')
      .select(`
        id,
        title,
        date,
        start_time,
        end_time,
        room,
        session_type,
        signature_link_token,
        signature_link_sent_at,
        signature_link_expires_at,
        formation_id,
        formations(title, level)
      `)
      .eq('id', attendanceSheetId)
      .single();

    if (sheetError || !sheet) {
      console.error('[send-signature-link] Sheet not found:', sheetError);
      return new Response(
        JSON.stringify({ error: 'Feuille d\'émargement non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les infos de l'expéditeur
    const { data: sender } = await supabase
      .from('users')
      .select('first_name, last_name, establishment_id')
      .eq('id', senderId)
      .single();

    const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Administration';
    // Use client-provided baseUrl (preview origin) or fallback to env/production
    const baseUrl = clientBaseUrl || Deno.env.get('APP_BASE_URL') || 'https://nectforma.com';

    // IMPORTANT: le lien dans le message doit toujours être valide.
    // Si le token est absent OU expiré, on en régénère un (même en mode "default").
    let signatureToken = (sheet.signature_link_token as string | null) || null;
    let signatureExpiresAt: string | null = (sheet as any).signature_link_expires_at ?? null;
    const isExpired = signatureExpiresAt ? new Date(signatureExpiresAt).getTime() < Date.now() : false;

    if (!signatureToken || isExpired) {
      signatureToken = generateTokenHex(32);
      const expiresAtIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: tokenUpdateError } = await supabase
        .from('attendance_sheets')
        .update({
          signature_link_token: signatureToken,
          signature_link_sent_at: new Date().toISOString(),
          signature_link_expires_at: expiresAtIso,
        })
        .eq('id', attendanceSheetId);

      if (tokenUpdateError) {
        console.error('[send-signature-link] Failed to (re)generate token:', tokenUpdateError);
        return new Response(
          JSON.stringify({ error: 'Impossible de générer le lien de signature' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      signatureExpiresAt = expiresAtIso;
      console.log('[send-signature-link] Token (re)generated and saved');
    }

    const signatureLink = `${baseUrl}/emargement/signer/${signatureToken}`;
    
    const formationTitle = (sheet.formations as any)?.title || 'Formation';
    const sessionDate = new Date(sheet.date).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const sessionTime = `${sheet.start_time.substring(0, 5)} - ${sheet.end_time.substring(0, 5)}`;
    const roomInfo = sheet.room ? `Salle: ${sheet.room}` : '';

    // Créer le message interne pour chaque étudiant
    const subject = `📋 Émargement à valider - ${formationTitle}`;
    const content = `
<div style="font-family: system-ui, sans-serif;">
  <h2 style="color: #3b82f6; margin-bottom: 16px;">Validation de présence requise</h2>
  
  <p>Bonjour,</p>
  
  <p>Vous êtes invité(e) à valider votre présence pour la session suivante :</p>
  
  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 0 0 8px 0;"><strong>📚 Formation :</strong> ${formationTitle}</p>
    <p style="margin: 0 0 8px 0;"><strong>📅 Date :</strong> ${sessionDate}</p>
    <p style="margin: 0 0 8px 0;"><strong>🕐 Horaires :</strong> ${sessionTime}</p>
    ${roomInfo ? `<p style="margin: 0;"><strong>📍 ${roomInfo}</strong></p>` : ''}
    ${sheet.session_type === 'autonomie' ? '<p style="margin: 8px 0 0 0; color: #3b82f6;"><strong>ℹ️ Session en autonomie</strong></p>' : ''}
  </div>
  
  <p style="margin-top: 24px;">
    <a href="${signatureLink}" 
       style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
      ✅ Valider ma présence
    </a>
  </p>
  
  <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
    Ce lien est valide pendant 24 heures. Si vous rencontrez des difficultés, contactez l'administration.
  </p>
  
  <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
    Envoyé par ${senderName}
  </p>
</div>
    `.trim();

    // En mode fallback+retryFailedOnly, on envoie seulement aux étudiants en échec dans le journal
    let finalStudentIds = [...studentIds];
    if (mode === 'fallback' && retryFailedOnly) {
      const { data: failedRows, error: failedErr } = await supabase
        .from('attendance_link_deliveries')
        .select('student_id')
        .eq('attendance_sheet_id', attendanceSheetId)
        .eq('status', 'failed');

      if (failedErr) {
        console.error('[send-signature-link] Failed to load failed deliveries:', failedErr);
      } else {
        const failedIds = (failedRows || []).map((r: any) => r.student_id as string);
        finalStudentIds = finalStudentIds.filter((id) => failedIds.includes(id));
      }
    }

    if (finalStudentIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aucun destinataire à relancer', delivered: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Créer le message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        subject,
        content,
        is_draft: false,
        attachment_count: 0
      })
      .select()
      .single();

    if (msgError || !message) {
      console.error('[send-signature-link] Error creating message:', msgError);
      throw new Error('Erreur lors de la création du message');
    }

    console.log(`[send-signature-link] Message created: ${message.id}`);

    // Créer les entrées pour chaque destinataire
    const recipients = finalStudentIds.map(studentId => ({
      message_id: message.id,
      recipient_id: studentId,
      recipient_type: 'user',
      is_read: false
    }));

    // Ajouter aussi une copie pour l'expéditeur
    recipients.push({
      message_id: message.id,
      recipient_id: senderId,
      recipient_type: 'sender',
      is_read: true
    });

    const { error: recipientsError } = await supabase
      .from('message_recipients')
      .insert(recipients);

    if (recipientsError) {
      console.error('[send-signature-link] Error creating recipients:', recipientsError);
      throw new Error('Erreur lors de l\'envoi aux destinataires');
    }

    console.log(`[send-signature-link] Recipients created: ${recipients.length}`);

    // Journal (fallback): upsert des lignes "pending"
    if (mode === 'fallback') {
      const upserts = finalStudentIds.map((studentId) => ({
        attendance_sheet_id: attendanceSheetId,
        student_id: studentId,
        status: 'pending',
        message_id: message.id,
        last_error: null,
        last_attempt_at: new Date().toISOString(),
      }));

      const { error: journalErr } = await supabase
        .from('attendance_link_deliveries')
        .upsert(upserts, { onConflict: 'attendance_sheet_id,student_id' });

      if (journalErr) {
        console.error('[send-signature-link] Journal upsert failed:', journalErr);
      }
    }

    // Créer des notifications in-app pour chaque étudiant (+ retry)
    const deliveryResults: Array<{ studentId: string; status: 'sent' | 'failed'; error?: string }> = [];

    for (const studentId of finalStudentIds) {
      let ok = false;
      let lastErr: string | undefined;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: studentId,
            title: '📋 Émargement à valider',
            message: `Vous avez un émargement à valider pour ${formationTitle} - ${sessionDate}`,
            type: 'attendance_request',
            metadata: {
              attendance_sheet_id: attendanceSheetId,
              signature_link: signatureLink,
              action_url: signatureLink,
            },
          });

        if (!notifError) {
          ok = true;
          break;
        }

        lastErr = notifError.message;
        console.warn(`[send-signature-link] Notification failed for ${studentId} attempt ${attempt}:`, notifError);
        await sleep(attempt === 1 ? 200 : attempt === 2 ? 500 : 1000);
      }

      deliveryResults.push({ studentId, status: ok ? 'sent' : 'failed', error: ok ? undefined : lastErr });

      if (mode === 'fallback') {
        // Incrément attempts proprement (read -> update)
        const { data: currentRow, error: currentErr } = await supabase
          .from('attendance_link_deliveries')
          .select('attempts')
          .eq('attendance_sheet_id', attendanceSheetId)
          .eq('student_id', studentId)
          .single();

        const nextAttempts = (currentRow?.attempts ?? 0) + 1;

        const { error: updErr } = await supabase
          .from('attendance_link_deliveries')
          .update({
            status: ok ? 'sent' : 'failed',
            attempts: nextAttempts,
            last_error: ok ? null : (lastErr || 'Erreur inconnue'),
            last_attempt_at: new Date().toISOString(),
            message_id: message.id,
          })
          .eq('attendance_sheet_id', attendanceSheetId)
          .eq('student_id', studentId);

        if (currentErr) {
          console.error('[send-signature-link] Failed to read delivery row attempts:', currentErr);
        }
        if (updErr) {
          console.error('[send-signature-link] Failed to update delivery row:', updErr);
        }
      }
    }

    console.log(`[send-signature-link] Notifications processed for ${finalStudentIds.length} students`);

    // Ouvrir la feuille pour signature
    await supabase
      .from('attendance_sheets')
      .update({
        is_open_for_signing: true,
        opened_at: new Date().toISOString(),
        status: 'En cours'
      })
      .eq('id', attendanceSheetId);

    console.log(`[send-signature-link] Sheet opened for signing`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Traitement terminé pour ${finalStudentIds.length} étudiants`,
        messageId: message.id,
        delivered: deliveryResults,
        signatureLink,
        expiresAt: signatureExpiresAt,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[send-signature-link] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
