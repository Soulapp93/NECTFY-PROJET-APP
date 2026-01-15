import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_ACCOUNTS = [
  { 
    email: 'admin.principal@demo.nectfy.fr', 
    password: 'Demo123!',
    role: 'AdminPrincipal',
    first_name: 'Admin',
    last_name: 'Principal'
  },
  { 
    email: 'admin@demo.nectfy.fr', 
    password: 'Demo123!',
    role: 'Admin',
    first_name: 'Admin',
    last_name: 'Demo'
  },
  { 
    email: 'formateur@demo.nectfy.fr', 
    password: 'Demo123!',
    role: 'Formateur',
    first_name: 'Formateur',
    last_name: 'Demo'
  },
  { 
    email: 'etudiant@demo.nectfy.fr', 
    password: 'Demo123!',
    role: 'Étudiant',
    first_name: 'Étudiant',
    last_name: 'Demo'
  },
  { 
    email: 'tuteur@demo.nectfy.fr', 
    password: 'Demo123!',
    role: 'Tuteur',
    first_name: 'Tuteur',
    last_name: 'Demo'
  },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // First, create or get demo establishment
    let establishmentId: string;
    
    const { data: existingEstablishment } = await supabaseAdmin
      .from('establishments')
      .select('id')
      .eq('email', 'demo@nectfy.fr')
      .maybeSingle();

    if (existingEstablishment) {
      establishmentId = existingEstablishment.id;
      console.log('Demo establishment already exists:', establishmentId);
    } else {
      const { data: newEstablishment, error: estError } = await supabaseAdmin
        .from('establishments')
        .insert({
          name: 'Établissement Démo NECTFY',
          type: 'Centre de formation',
          email: 'demo@nectfy.fr',
          address: '123 Rue de la Démo, 75001 Paris',
          phone: '01 23 45 67 89',
          director: 'Admin Principal Demo'
        })
        .select('id')
        .single();

      if (estError) {
        console.error('Error creating demo establishment:', estError);
        throw new Error('Failed to create demo establishment');
      }
      
      establishmentId = newEstablishment.id;
      console.log('Created demo establishment:', establishmentId);
    }

    // Create demo formation
    let formationId: string | null = null;
    
    const { data: existingFormation } = await supabaseAdmin
      .from('formations')
      .select('id')
      .eq('establishment_id', establishmentId)
      .eq('title', 'Formation Démo')
      .maybeSingle();

    if (existingFormation) {
      formationId = existingFormation.id;
    } else {
      const { data: newFormation } = await supabaseAdmin
        .from('formations')
        .insert({
          establishment_id: establishmentId,
          title: 'Formation Démo',
          description: 'Formation de démonstration pour tester les fonctionnalités',
          level: 'Intermédiaire',
          duration: 100,
          max_students: 30,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Actif',
          color: '#8B5CF6'
        })
        .select('id')
        .single();

      if (newFormation) {
        formationId = newFormation.id;
        console.log('Created demo formation:', formationId);
      }
    }

    const results: any[] = [];

    // Create each demo account
    for (const account of DEMO_ACCOUNTS) {
      try {
        // Check if user already exists in auth
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === account.email);

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          console.log(`User ${account.email} already exists:`, userId);
        } else {
          // Create auth user
          const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
            user_metadata: {
              first_name: account.first_name,
              last_name: account.last_name
            }
          });

          if (authError) {
            console.error(`Error creating auth user ${account.email}:`, authError);
            results.push({ email: account.email, success: false, error: authError.message });
            continue;
          }

          userId = newUser.user.id;
          console.log(`Created auth user ${account.email}:`, userId);
        }

        // Check if user exists in public.users
        const { data: existingProfile } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!existingProfile) {
          // Create user profile
          const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
              id: userId,
              email: account.email,
              first_name: account.first_name,
              last_name: account.last_name,
              role: account.role,
              establishment_id: establishmentId,
              status: 'Actif',
              is_activated: true
            });

          if (profileError) {
            console.error(`Error creating profile for ${account.email}:`, profileError);
          } else {
            console.log(`Created profile for ${account.email}`);
          }
        }

        // Assign student to formation if applicable
        if (formationId && (account.role === 'Étudiant' || account.role === 'Formateur')) {
          const { data: existingAssignment } = await supabaseAdmin
            .from('user_formation_assignments')
            .select('id')
            .eq('user_id', userId)
            .eq('formation_id', formationId)
            .maybeSingle();

          if (!existingAssignment) {
            await supabaseAdmin
              .from('user_formation_assignments')
              .insert({
                user_id: userId,
                formation_id: formationId
              });
            console.log(`Assigned ${account.email} to demo formation`);
          }
        }

        // Create tutor record if applicable
        if (account.role === 'Tuteur') {
          const { data: existingTutor } = await supabaseAdmin
            .from('tutors')
            .select('id')
            .eq('email', account.email)
            .maybeSingle();

          let tutorId = existingTutor?.id;

          if (!existingTutor) {
            // Le tuteur doit avoir le même ID que l'auth user pour que useCurrentUser fonctionne
            const { data: newTutor } = await supabaseAdmin
              .from('tutors')
              .insert({
                id: userId,
                establishment_id: establishmentId,
                first_name: account.first_name,
                last_name: account.last_name,
                email: account.email,
                company_name: 'Entreprise Démo',
                position: 'Tuteur professionnel',
                is_activated: true
              })
              .select('id')
              .single();
            
            if (newTutor) {
              tutorId = newTutor.id;
            }
            console.log(`Created tutor record for ${account.email}`);
          }

          // Assigner le tuteur à l'étudiant démo
          if (tutorId) {
            // Trouver l'étudiant démo
            const { data: studentUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('email', 'etudiant@demo.nectfy.fr')
              .eq('establishment_id', establishmentId)
              .maybeSingle();

            if (studentUser) {
              // Vérifier si l'assignation existe déjà
              const { data: existingAssignment } = await supabaseAdmin
                .from('tutor_student_assignments')
                .select('id')
                .eq('tutor_id', tutorId)
                .eq('student_id', studentUser.id)
                .maybeSingle();

              if (!existingAssignment) {
                await supabaseAdmin
                  .from('tutor_student_assignments')
                  .insert({
                    tutor_id: tutorId,
                    student_id: studentUser.id,
                    is_active: true,
                    contract_type: 'Apprentissage',
                    contract_start_date: new Date().toISOString().split('T')[0],
                    contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  });
                console.log(`Assigned tutor ${account.email} to student etudiant@demo.nectfy.fr`);
              }
            }
          }
        }

        results.push({ email: account.email, success: true, role: account.role });
      } catch (error: any) {
        console.error(`Error processing ${account.email}:`, error);
        results.push({ email: account.email, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo accounts setup completed',
        establishmentId,
        formationId,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Setup demo accounts error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
