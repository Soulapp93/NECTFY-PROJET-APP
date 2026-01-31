import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteTutorRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company_name: string;
  company_address?: string;
  position?: string;
  establishment_id: string;
  student_id?: string; // ID de l'étudiant à assigner (optionnel)
  redirect_url?: string;
}

const sendEmailWithBrevo = async (to: string, subject: string, htmlContent: string) => {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY non configurée");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "NECTFORMA",
        email: "noreply@nectforma.com",
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("[invite-tutor-native] ❌ Brevo API error:", errorData);
    throw new Error(`Brevo API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[invite-tutor-native] 📩 Request received");

    // Verify the requesting user is authenticated and has admin rights
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[invite-tutor-native] ❌ Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      console.warn("[invite-tutor-native] ❌ Invalid token", { authError: authError?.message });
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get requesting user's role and establishment
    const { data: requestingUserData, error: userDataError } = await supabaseAdmin
      .from("users")
      .select("role, establishment_id")
      .eq("id", requestingUser.id)
      .single();

    if (userDataError || !requestingUserData) {
      console.warn("[invite-tutor-native] ❌ Requesting user not found in public.users", { userDataError: userDataError?.message });
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminRoles = new Set([
      "Admin",
      "AdminPrincipal",
      "Administrateur",
      "Administrateur principal",
    ]);

    // Only admins can invite tutors
    if (!adminRoles.has(requestingUserData.role)) {
      console.warn("[invite-tutor-native] ❌ Insufficient rights", { role: requestingUserData.role });
      return new Response(
        JSON.stringify({ error: "Droits insuffisants" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[invite-tutor-native] ✅ Authorized", { requesterId: requestingUser.id, role: requestingUserData.role });

    const body: InviteTutorRequest = await req.json();
    const { email, first_name, last_name, phone, company_name, company_address, position, establishment_id, student_id, redirect_url } = body;

    // Validate required fields
    if (!email || !first_name || !last_name || !company_name || !establishment_id) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants (email, prénom, nom, entreprise, établissement)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if tutor already exists in tutors table
    const { data: existingTutor } = await supabaseAdmin
      .from("tutors")
      .select("id, is_activated")
      .eq("email", normalizedEmail)
      .eq("establishment_id", establishment_id)
      .maybeSingle();

    // Get establishment name for email
    const { data: establishment } = await supabaseAdmin
      .from('establishments')
      .select('name')
      .eq('id', establishment_id)
      .single();

    const establishmentName = establishment?.name || 'NECTFORMA';

    // Get student info if provided
    let studentInfo = null;
    if (student_id) {
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', student_id)
        .single();
      studentInfo = student;
    }

    let tutorId: string;
    let isNewTutor = false;

    if (existingTutor) {
      console.log("[invite-tutor-native] 📋 Tutor already exists", { tutorId: existingTutor.id, is_activated: existingTutor.is_activated });
      tutorId = existingTutor.id;

      // If student_id provided, create assignment
      if (student_id) {
        // Deactivate existing assignments for this student
        await supabaseAdmin
          .from('tutor_student_assignments')
          .update({ is_active: false })
          .eq('student_id', student_id);

        // Create new assignment
        await supabaseAdmin
          .from('tutor_student_assignments')
          .insert({
            tutor_id: tutorId,
            student_id: student_id,
            is_active: true
          });

        console.log("[invite-tutor-native] ✅ Student assigned to existing tutor");
      }

      // If tutor not activated, resend activation email
      if (!existingTutor.is_activated) {
        // Check if there's an existing activation token
        const { data: existingToken } = await supabaseAdmin
          .from('user_activation_tokens')
          .select('token, expires_at')
          .eq('user_id', tutorId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let activationToken: string;
        
        if (existingToken && new Date(existingToken.expires_at) > new Date()) {
          // Use existing valid token
          activationToken = existingToken.token;
        } else {
          // Create new token
          activationToken = crypto.randomUUID() + '-' + Date.now();
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

          await supabaseAdmin
            .from('user_activation_tokens')
            .insert({
              user_id: tutorId,
              token: activationToken,
              expires_at: expiresAt.toISOString()
            });
        }

        // Send activation email
        const baseUrl = redirect_url || "https://nectforma.com";
        const activationLink = `${baseUrl}/activation?token=${activationToken}`;

        const htmlContent = generateTutorActivationEmail(first_name, last_name, establishmentName, studentInfo, activationLink);

        await sendEmailWithBrevo(
          normalizedEmail,
          `Activez votre compte Tuteur — NECTFORMA`,
          htmlContent
        );

        console.log("[invite-tutor-native] ✅ Activation email resent to existing tutor");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: existingTutor.is_activated 
            ? "Tuteur existant assigné à l'étudiant" 
            : "Email d'activation renvoyé au tuteur",
          tutor_id: tutorId,
          is_new: false
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new tutor
    isNewTutor = true;
    console.log("[invite-tutor-native] 🆕 Creating new tutor");

    // Create auth user first (without sending Supabase email)
    const tempPassword = crypto.randomUUID();
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        first_name,
        last_name,
        role: 'Tuteur',
        establishment_id,
        company_name,
      },
    });

    if (authCreateError) {
      console.error("[invite-tutor-native] ❌ Error creating auth user:", authCreateError);
      return new Response(
        JSON.stringify({ error: authCreateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    tutorId = authData.user.id;

    // Generate activation token
    const activationToken = crypto.randomUUID() + '-' + Date.now();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert activation token
    const { error: tokenError } = await supabaseAdmin
      .from('user_activation_tokens')
      .insert({
        user_id: tutorId,
        token: activationToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error("[invite-tutor-native] ❌ Token creation error:", tokenError);
      await supabaseAdmin.auth.admin.deleteUser(tutorId);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du token d'activation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create tutor record in tutors table (with the auth user ID)
    const { error: insertError } = await supabaseAdmin
      .from("tutors")
      .insert({
        id: tutorId,
        email: normalizedEmail,
        first_name,
        last_name,
        phone: phone || null,
        company_name,
        company_address: company_address || null,
        position: position || null,
        establishment_id,
        is_activated: false,
      });

    if (insertError) {
      console.error("[invite-tutor-native] ❌ Error creating tutor record:", insertError);
      await supabaseAdmin.from('user_activation_tokens').delete().eq('user_id', tutorId);
      await supabaseAdmin.auth.admin.deleteUser(tutorId);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création du tuteur" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If student_id provided, create assignment
    if (student_id) {
      // Deactivate existing assignments for this student
      await supabaseAdmin
        .from('tutor_student_assignments')
        .update({ is_active: false })
        .eq('student_id', student_id);

      // Create new assignment
      const { error: assignmentError } = await supabaseAdmin
        .from('tutor_student_assignments')
        .insert({
          tutor_id: tutorId,
          student_id: student_id,
          is_active: true
        });

      if (assignmentError) {
        console.error("[invite-tutor-native] ⚠️ Assignment error (non-blocking):", assignmentError);
      } else {
        console.log("[invite-tutor-native] ✅ Student assigned to new tutor");
      }
    }

    // Generate activation link
    const baseUrl = redirect_url || "https://nectforma.com";
    const activationLink = `${baseUrl}/activation?token=${activationToken}`;

    console.log(`[invite-tutor-native] 📧 Sending activation email to ${normalizedEmail} via Brevo`);
    console.log(`[invite-tutor-native] 🔗 Activation link: ${activationLink}`);

    const htmlContent = generateTutorActivationEmail(first_name, last_name, establishmentName, studentInfo, activationLink);

    try {
      const emailResult = await sendEmailWithBrevo(
        normalizedEmail,
        `Activez votre compte Tuteur — NECTFORMA`,
        htmlContent
      );

      console.log(`[invite-tutor-native] ✅ Email sent successfully via Brevo`, { messageId: emailResult.messageId });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Tuteur créé et invitation envoyée avec succès",
          tutor_id: tutorId,
          is_new: true,
          email_id: emailResult.messageId
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("[invite-tutor-native] ❌ Brevo email error:", emailError);
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: "Tuteur créé mais erreur envoi email",
          tutor_id: tutorId,
          is_new: true,
          email_error: emailError instanceof Error ? emailError.message : "Erreur inconnue"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("[invite-tutor-native] ❌ Critical error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateTutorActivationEmail(
  firstName: string, 
  lastName: string, 
  establishmentName: string, 
  studentInfo: { first_name: string; last_name: string; email: string } | null,
  activationLink: string
): string {
  const studentSection = studentInfo ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
      <p style="color: #166534; font-size: 14px; margin: 0; font-weight: 600;">
        🎓 Votre apprenti(e) :
      </p>
      <p style="color: #166534; font-size: 16px; margin: 8px 0 0 0;">
        <strong>${studentInfo.first_name} ${studentInfo.last_name}</strong><br>
        <span style="font-size: 14px; color: #15803d;">${studentInfo.email}</span>
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">NECTFORMA</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">Plateforme intelligente de gestion de formation</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a1a1a; margin: 0 0 24px; font-size: 24px; font-weight: 600;">
            🤝 Bienvenue en tant que Tuteur Entreprise
          </h2>
          
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            Bonjour <strong>${firstName} ${lastName}</strong>,
          </p>
          
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            L'établissement <strong style="color: #8B5CF6;">${establishmentName}</strong> vous a désigné comme <strong>Tuteur Entreprise</strong> sur la plateforme Nectforma.
          </p>
          
          ${studentSection}
          
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 20px;">
            En tant que tuteur, vous pourrez :
          </p>
          
          <ul style="color: #4a4a4a; line-height: 1.8; font-size: 15px; padding-left: 20px; margin-bottom: 24px;">
            <li>📚 Consulter les formations de votre apprenti(e)</li>
            <li>📅 Suivre son emploi du temps</li>
            <li>✅ Visualiser l'historique d'émargement</li>
            <li>📝 Accéder au cahier de texte</li>
          </ul>
          
          <p style="color: #4a4a4a; line-height: 1.7; font-size: 16px; margin-bottom: 8px;">
            👉 Cliquez sur le bouton ci-dessous pour activer votre compte :
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);">
              🔐 Activer mon compte Tuteur
            </a>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
              ⏳ Ce lien est valide pendant 7 jours.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
            Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
          </p>
        </div>
        
        <!-- Security Section -->
        <div style="background-color: #f8f7ff; padding: 24px 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #4a4a4a; font-size: 14px; margin: 0 0 12px; font-weight: 600;">
            🔒 Sécurité & confidentialité
          </p>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
            En activant votre compte, vous acceptez nos :<br>
            📄 <a href="https://nectforma.com/cgu" target="_blank" style="color: #8B5CF6; text-decoration: none;">Conditions Générales d'Utilisation</a><br>
            🔐 <a href="https://nectforma.com/politique-confidentialite" target="_blank" style="color: #8B5CF6; text-decoration: none;">Politique de Confidentialité</a>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #1a1a2e; padding: 32px 30px; text-align: center;">
          <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px; font-weight: 500;">
            Cordialement,<br>
            L'équipe Nectforma
          </p>
          <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 8px 0 16px;">
            Plateforme intelligente de gestion de formation
          </p>
          <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px;">
            <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0;">
              🌐 <a href="https://nectforma.com" style="color: #a78bfa; text-decoration: none;">https://nectforma.com</a><br>
              📩 <a href="mailto:contact@nectforma.com" style="color: #a78bfa; text-decoration: none;">contact@nectforma.com</a>
            </p>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 16px;">
            © ${new Date().getFullYear()} NECTFORMA. Tous droits réservés.
          </p>
        </div>
      </div>
      
      <!-- Fallback Link -->
      <div style="max-width: 600px; margin: 16px auto 0; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
          <a href="${activationLink}" style="color: #8B5CF6; word-break: break-all; font-size: 10px;">${activationLink}</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
