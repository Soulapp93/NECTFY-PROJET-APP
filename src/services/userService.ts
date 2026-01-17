
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant';
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
  role: 'AdminPrincipal' | 'Admin' | 'Formateur' | 'Étudiant';
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
        redirect_url: window.location.origin
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
    return data || [];
  },

  async getUserById(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
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

        await supabase
          .from('user_formation_assignments')
          .upsert(assignments, { onConflict: 'user_id,formation_id', ignoreDuplicates: true } as any);
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

    // Handle tutor data for students
    if (tutorData && userData.role === 'Étudiant') {
      try {
        const tutorCreateData = {
          first_name: tutorData.first_name,
          last_name: tutorData.last_name,
          email: tutorData.email,
          phone: tutorData.phone,
          company_name: tutorData.company_name,
          company_address: tutorData.company_address,
          position: tutorData.position,
          establishment_id: establishmentId
        };

        const { data: tutor, error: tutorError } = await supabase
          .from('tutors')
          .insert([tutorCreateData])
          .select()
          .single();

        if (tutorError) throw tutorError;

        const assignmentData = {
          tutor_id: tutor.id,
          student_id: newUser.id,
          contract_type: tutorData.contract_type,
          contract_start_date: tutorData.contract_start_date,
          contract_end_date: tutorData.contract_end_date
        };

        await supabase
          .from('tutor_student_assignments')
          .insert([assignmentData]);
      } catch (tutorError) {
        console.error('Erreur lors de la création du tuteur:', tutorError);
      }
    }

    return newUser;
  },

  async updateUser(id: string, userData: Partial<CreateUserData>, formationIds?: string[]): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
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

    return data;
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

  async bulkCreateUsers(usersData: CreateUserData[]): Promise<User[]> {
    const establishmentId = await getCurrentUserEstablishmentId();
    const emails = usersData.map((u) => u.email.trim().toLowerCase());

    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email')
      .in('email', emails);

    const existingEmailSet = new Set((existingUsers || []).map((u) => u.email));
    const usersToCreate = usersData.filter((u) => !existingEmailSet.has(u.email.trim().toLowerCase()));

    if (usersToCreate.length === 0) {
      throw new Error("Aucun utilisateur importé : tous les emails existent déjà.");
    }

    const createdUsers: User[] = [];

    // Create users one by one using native invitation
    for (const userData of usersToCreate) {
      try {
        const user = await this.createUser(userData, []);
        createdUsers.push(user);
      } catch (error) {
        console.error(`Erreur création utilisateur ${userData.email}:`, error);
      }
    }

    if (createdUsers.length === 0) {
      throw new Error("Aucun utilisateur n'a pu être créé.");
    }

    return createdUsers;
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
