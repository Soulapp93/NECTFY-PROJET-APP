import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSignatureLinkRequest {
  attendanceSheetId: string;
  studentIds: string[];
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const senderId = claimsData.user.id;

    // Parser le body
    const { attendanceSheetId, studentIds }: SendSignatureLinkRequest = await req.json();

    if (!attendanceSheetId || !studentIds || studentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'attendanceSheetId et studentIds sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-signature-link] Sending to ${studentIds.length} students for sheet ${attendanceSheetId}`);

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
    const baseUrl = Deno.env.get('APP_BASE_URL') || 'https://nectforma.com';
    const signatureLink = `${baseUrl}/emargement/signer/${sheet.signature_link_token}`;
    
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
    const recipients = studentIds.map(studentId => ({
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

    // Créer des notifications in-app pour chaque étudiant
    for (const studentId of studentIds) {
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          title: '📋 Émargement à valider',
          message: `Vous avez un émargement à valider pour ${formationTitle} - ${sessionDate}`,
          type: 'attendance_request',
          metadata: {
            attendance_sheet_id: attendanceSheetId,
            signature_link: signatureLink,
            action_url: signatureLink
          }
        });
    }

    console.log(`[send-signature-link] Notifications created for ${studentIds.length} students`);

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
        message: `Lien envoyé à ${studentIds.length} étudiants`,
        messageId: message.id
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
