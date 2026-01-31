
import { supabase } from '@/integrations/supabase/client';
import { getAppBaseUrl } from '@/lib/appBaseUrl';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant' | 'Tuteur';
  status: 'Actif' | 'Inactif' | 'En attente';
  phone?: string;
  created_at: string;
  updated_at: string;
  establishment_id: string;
  is_activated?: boolean;
  profile_photo_url?: string;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  role: 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant' | 'Tuteur';
  status: 'Actif' | 'Inactif' | 'En attente';
  phone?: string;
  profile_photo_url?: string;
}

// Helper function to get the current user's establishment_id
async function getCurrentUserEstablishmentId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    throw new Error('Utilisateur non connecté');
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('establishment_id')
    .eq('id', session.user.id)
    .single();

  if (error || !userData?.establishment_id) {
    throw new Error('Impossible de récupérer l\'établissement de l\'utilisateur');
  }

  return userData.establishment_id;
}

// NEW: Native Supabase invitation via invite-user-native edge function
async function sendNativeInvitation(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
  establishmentId: string
): Promise<{ success: boolean; user_id?: string; error?: string }> {
  try {
    console.log(`Envoi invitation native Supabase à ${email}...`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Session non trouvée');
    }
    
    const { data, error } = await supabase.functions.invoke('invite-user-native', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        establishment_id: establishmentId,
        redirect_url: getAppBaseUrl(),
      }
    });

    if (error) {
      console.error('Erreur invitation native:', error);
      return { success: false, error: error.message };
    }
    
    if (data?.error) {
      console.error('Erreur API invitation:', data.error);
      return { success: false, error: data.error };
    }

    console.log('✅ Invitation native envoyée:', data);
    return { success: true, user_id: data.user_id };
  } catch (error: any) {
    console.error('Erreur lors de l\'invitation native:', error);
    return { success: false, error: error.message };
  }
}

// NEW: Native Supabase invitation for tutors via invite-tutor-native edge function
async function inviteTutorNative(
  email: string,
  firstName: string,
  lastName: string,
  phone: string | undefined,
  companyName: string,
  position: string | undefined,
  establishmentId: string,
  studentId?: string
): Promise<{ success: boolean; tutor_id?: string; error?: string }> {
  try {
    console.log(`Envoi invitation tuteur native à ${email}...`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Session non trouvée');
    }
    
    const { data, error } = await supabase.functions.invoke('invite-tutor-native', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        company_name: companyName,
        position,
        establishment_id: establishmentId,
        student_id: studentId,
        redirect_url: getAppBaseUrl(),
      }
    });

    if (error) {
      console.error('Erreur invitation tuteur native:', error);
      return { success: false, error: error.message };
    }
    
    if (data?.error) {
      console.error('Erreur API invitation tuteur:', data.error);
      return { success: false, error: data.error };
    }

    console.log('✅ Invitation tuteur native envoyée:', data);
    return { success: true, tutor_id: data.tutor_id };
  } catch (error: any) {
    console.error('Erreur lors de l\'invitation tuteur native:', error);
    return { success: false, error: error.message };
  }
}

// Legacy: send activation email (fallback for existing users)
async function sendLegacyActivationEmail(user: User, establishmentId: string): Promise<void> {
  try {
    console.log(`Sending legacy activation email to ${user.email}...`);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('No session found - cannot send activation email');
      return;
    }
    
    const { data, error } = await supabase.functions.invoke('send-user-activation', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        establishmentId: establishmentId
      }
    });

    if (error) {
      console.error('Error sending activation email:', error);
      throw error;
    }
    
    if (data?.error) {
      console.error('Activation email API error:', data.error);
      throw new Error(data.error);
    }

    console.log('Legacy activation email sent successfully:', data);
  } catch (error) {
    console.error('Failed to send activation email:', error);
  }
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as User[];
  },

  async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  },

  async createUser(userData: CreateUserData, formationIds: string[] = [], tutorData?: any): Promise<User> {
    const establishmentId = await getCurrentUserEstablishmentId();
    const normalizedEmail = userData.email.trim().toLowerCase();

    // Check if user already exists in this establishment
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError && (existingError as any).code !== 'PGRST116') {
      throw existingError;
    }

    if (existingUser) {
      // User exists - assign formations and resend invitation if needed
      if (formationIds.length > 0) {
        const assignments = formationIds.map((formationId) => ({
          user_id: existingUser.id,
          formation_id: formationId,
        }));

        const { error: upsertError } = await supabase
          .from('user_formation_assignments')
          .upsert(assignments, { onConflict: 'user_id,formation_id', ignoreDuplicates: true } as any);

        if (upsertError) {
          console.error('Erreur lors de l\'assignation des formations (utilisateur existant):', upsertError);
          throw upsertError;
        }
      }

      // Resend invitation if not activated
      if (!existingUser.is_activated) {
        await supabase.functions.invoke('resend-invitation-native', {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: { email: normalizedEmail }
        });
      }

      return existingUser as User;
    }

    // NEW: Use native Supabase invitation - this creates both auth user and users table entry
    const inviteResult = await sendNativeInvitation(
      normalizedEmail,
      userData.first_name,
      userData.last_name,
      userData.role,
      establishmentId
    );

    if (!inviteResult.success || !inviteResult.user_id) {
      throw new Error(inviteResult.error || 'Échec de l\'invitation');
    }

    // Get the created user
    const { data: newUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', inviteResult.user_id)
      .single();

    if (fetchError || !newUser) {
      throw new Error('Utilisateur créé mais impossible de le récupérer');
    }

    // Assign formations
    if (formationIds.length > 0) {
      const assignments = formationIds.map((formationId) => ({
        user_id: newUser.id,
        formation_id: formationId,
      }));

      const { error: assignmentError } = await supabase
        .from('user_formation_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    // Handle tutor data for students - Use invite-tutor-native Edge Function
    if (tutorData && userData.role === 'Étudiant') {
      const tutorResult = await inviteTutorNative(
        tutorData.email,
        tutorData.first_name,
        tutorData.last_name,
        tutorData.phone,
        tutorData.company_name,
        tutorData.position,
        establishmentId,
        newUser.id // student_id pour l'assignation automatique
      );
      
      if (!tutorResult.success) {
        console.error('Erreur lors de l\'invitation du tuteur:', tutorResult.error);
        // On ne bloque pas la création de l'étudiant, mais on logue l'erreur
      } else {
        console.log('✅ Tuteur invité et assigné à l\'étudiant:', tutorResult.tutor_id);
      }
    }

    return newUser as User;
  },

  async updateUser(id: string, userData: Partial<CreateUserData>, formationIds?: string[], tutorData?: any): Promise<User> {
    const { role, ...safeUserData } = userData;
    const updateData = role && role !== 'Tuteur' ? { ...safeUserData, role } : safeUserData;
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (formationIds !== undefined) {
      await supabase
        .from('user_formation_assignments')
        .delete()
        .eq('user_id', id);

      if (formationIds.length > 0) {
        const assignments = formationIds.map((formationId) => ({
          user_id: id,
          formation_id: formationId,
        }));

        const { error: assignmentError } = await supabase
          .from('user_formation_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }
    }

    // Handle tutor data for students - Use invite-tutor-native Edge Function
    if (tutorData && data.role === 'Étudiant') {
      const establishmentId = await getCurrentUserEstablishmentId();
      
      const tutorResult = await inviteTutorNative(
        tutorData.email,
        tutorData.first_name,
        tutorData.last_name,
        tutorData.phone,
        tutorData.company_name,
        tutorData.position,
        establishmentId,
        id // student_id pour l'assignation automatique
      );
      
      if (!tutorResult.success) {
        console.error('Erreur lors de l\'invitation du tuteur:', tutorResult.error);
      } else {
        console.log('✅ Tuteur invité/mis à jour et assigné à l\'étudiant:', tutorResult.tutor_id);
      }
    }

    return data as User;
  },

  async getUserFormations(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_formation_assignments')
      .select('formation_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      return [];
    }

    return data?.map(d => d.formation_id) || [];
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreateUsers(usersData: (CreateUserData & { _formationNames?: string[] })[]): Promise<User[]> {
    const establishmentId = await getCurrentUserEstablishmentId();
    const emails = usersData.map((u) => u.email.trim().toLowerCase());

    const { data: existingUsers, error: existingUsersError } = await supabase
      .from('users')
      .select('id, email, is_activated')
      .in('email', emails);

    if (existingUsersError) throw existingUsersError;

    const existingByEmail = new Map<string, { id: string; is_activated: boolean | null }>();
    (existingUsers || []).forEach((u) => existingByEmail.set(u.email.toLowerCase(), { id: u.id, is_activated: u.is_activated }));

    // Charger toutes les formations de l'établissement pour la résolution des noms
    const { data: allFormations } = await supabase
      .from('formations')
      .select('id, title')
      .eq('establishment_id', establishmentId);

    const formationMap = new Map<string, string>();
    (allFormations || []).forEach((f) => {
      formationMap.set(f.title.toLowerCase().trim(), f.id);
    });

    const results: User[] = [];

    // Créer les nouveaux utilisateurs + (important) assigner formations aux utilisateurs déjà existants
    for (const userData of usersData) {
      try {
        // Résoudre les noms de formations en IDs
        const formationNames = userData._formationNames || [];
        const formationIds: string[] = [];
        
        for (const name of formationNames) {
          const normalizedName = name.toLowerCase().trim();
          // Recherche exacte puis partielle
          let formationId = formationMap.get(normalizedName);
          if (!formationId) {
            // Recherche partielle
            for (const [key, id] of formationMap.entries()) {
              if (key.includes(normalizedName) || normalizedName.includes(key)) {
                formationId = id;
                break;
              }
            }
          }
          if (formationId) {
            formationIds.push(formationId);
          } else {
            console.warn(`Formation non trouvée: "${name}"`);
          }
        }

        const normalizedEmail = userData.email.trim().toLowerCase();
        const existing = existingByEmail.get(normalizedEmail);

        // Cas 1: utilisateur déjà existant -> on ASSIGNE les formations (upsert), sans recréer le compte
        if (existing) {
          if (formationIds.length > 0) {
            const assignments = formationIds.map((formationId) => ({
              user_id: existing.id,
              formation_id: formationId,
            }));

            const { error: upsertError } = await supabase
              .from('user_formation_assignments')
              .upsert(assignments, { onConflict: 'user_id,formation_id', ignoreDuplicates: true } as any);

            if (upsertError) throw upsertError;
          }

          // Optionnel: si le compte n'est pas activé, on peut renvoyer l'invitation
          if (!existing.is_activated) {
            await supabase.functions.invoke('resend-invitation-native', {
              headers: {
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
              body: { email: normalizedEmail },
            });
          }

          const refreshed = await this.getUserById(existing.id);
          results.push(refreshed);
          continue;
        }

        // Cas 2: nouvel utilisateur -> création + assignation formations
        const { _formationNames, ...cleanUserData } = userData;
        const created = await this.createUser(cleanUserData, formationIds);
        results.push(created);
      } catch (error) {
        console.error(`Erreur création utilisateur ${userData.email}:`, error);
      }
    }

    if (results.length === 0) {
      throw new Error("Aucun utilisateur n'a pu être créé ou mis à jour.");
    }

    return results;
  },

  // Resend activation email using native Supabase invitation
  async resendActivationEmail(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Session non trouvée');
    }

    const { data, error } = await supabase.functions.invoke('resend-invitation-native', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { email: user.email }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    console.log('✅ Invitation renvoyée via Supabase Auth natif');
  }
};
