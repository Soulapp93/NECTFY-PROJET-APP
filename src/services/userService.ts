
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

// Envoie l'email d'activation via Edge Function (token généré côté serveur)
async function sendActivationEmail(
  userId: string,
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.functions.invoke('send-activation-email', {
      body: {
        userId,
        email: normalizedEmail,
        firstName,
        lastName,
      },
    });

    if (error) {
      console.error('Erreur envoi email:', error);
      return { success: false, error: error.message };
    }

    if (data?.error) {
      console.error('Erreur API email:', data.error);
      return { success: false, error: data.error };
    }

    console.log("✅ Email d'activation envoyé:", data);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de l'envoi de l'email d'activation:", error);
    return { success: false, error: error.message };
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

      // Resend activation email if not activated
      if (!existingUser.is_activated) {
        await sendActivationEmail(
          existingUser.id,
          normalizedEmail,
          existingUser.first_name,
          existingUser.last_name
        );
        console.log('Email d\'activation renvoyé pour:', normalizedEmail);
      }

      return existingUser as User;
    }

    // Get current user for created_by
    const { data: { session } } = await supabase.auth.getSession();
    const createdBy = session?.user?.id;
    
    if (!createdBy) {
      throw new Error('Session utilisateur non trouvée');
    }

    // Create user in database first
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: normalizedEmail,
        role: userData.role,
        status: 'En attente',
        phone: userData.phone,
        profile_photo_url: userData.profile_photo_url,
        establishment_id: establishmentId,
        is_activated: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur création utilisateur:', insertError);
      throw new Error(insertError.message);
    }

    // Send activation email via Elastic Email
    const emailResult = await sendActivationEmail(
      newUser.id,
      normalizedEmail,
      userData.first_name,
      userData.last_name
    );

    if (!emailResult.success) {
      console.warn('Email d\'activation non envoyé:', emailResult.error);
      // Don't throw - user is created, just email failed
    } else {
      console.log('✅ Email d\'activation envoyé à:', normalizedEmail);
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

  // Resend activation email
  async resendActivationEmail(userId: string): Promise<{ success: boolean }> {
    const user = await this.getUserById(userId);
    
    const result = await sendActivationEmail(
      user.id,
      user.email,
      user.first_name,
      user.last_name
    );

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'envoi de l\'email');
    }

    console.log('✅ Email d\'activation renvoyé à:', user.email);
    return { success: true };
  }
};
