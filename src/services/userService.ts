
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

// Helper function to send activation email
async function sendActivationEmail(user: User, establishmentId: string): Promise<void> {
  try {
    console.log(`Sending activation email to ${user.email}...`);
    
    // Get current session for JWT token
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
    
    // Check for application-level errors
    if (data?.error) {
      console.error('Activation email API error:', data.error);
      throw new Error(data.error);
    }

    console.log('Activation email sent successfully:', data);
  } catch (error) {
    console.error('Failed to send activation email:', error);
    // Don't throw - we don't want to fail user creation if email fails
  }
}

export const userService = {
  async getUsers(): Promise<User[]> {
    // RLS will automatically filter by establishment
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
    // Get the current user's establishment_id
    const establishmentId = await getCurrentUserEstablishmentId();

    const normalizedEmail = userData.email.trim().toLowerCase();

    // 1) Idempotency: if user already exists in this establishment, reuse it
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('*')
      .eq('establishment_id', establishmentId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    // Ignore "no rows"; surface other errors
    if (existingError && (existingError as any).code !== 'PGRST116') {
      throw existingError;
    }

    if (existingUser) {
      // Ensure formations are assigned (best-effort)
      if (formationIds.length > 0) {
        const assignments = formationIds.map((formationId) => ({
          user_id: existingUser.id,
          formation_id: formationId,
        }));

        // upsert avoids failing on duplicates if a unique constraint exists
        const { error: assignmentError } = await supabase
          .from('user_formation_assignments')
          .upsert(assignments, { onConflict: 'user_id,formation_id', ignoreDuplicates: true } as any);

        if (assignmentError) {
          // Do not block the flow for formation assignment issues in this path
          console.error('Erreur lors de l\'assignation des formations (utilisateur existant):', assignmentError);
        }
      }

      // Re-send activation link if needed (best-effort)
      if (!existingUser.is_activated) {
        await sendActivationEmail(existingUser as User, establishmentId);
      }

      return existingUser as User;
    }

    // 2) Create new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          ...userData,
          email: normalizedEmail,
          establishment_id: establishmentId,
          is_activated: false,
          status: 'En attente',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Assigner l'utilisateur aux formations
    if (formationIds.length > 0) {
      const assignments = formationIds.map((formationId) => ({
        user_id: data.id,
        formation_id: formationId,
      }));

      const { error: assignmentError } = await supabase
        .from('user_formation_assignments')
        .insert(assignments);

      // Important: si l'association échoue, on remonte l'erreur pour que l'UI puisse l'afficher
      if (assignmentError) throw assignmentError;
    }

    // Si des données de tuteur sont fournies et que l'utilisateur est un étudiant, créer le tuteur
    if (tutorData && userData.role === 'Étudiant') {
      try {
        // Créer le tuteur
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

        // Créer l'assignation tuteur-étudiant
        const assignmentData = {
          tutor_id: tutor.id,
          student_id: data.id,
          contract_type: tutorData.contract_type,
          contract_start_date: tutorData.contract_start_date,
          contract_end_date: tutorData.contract_end_date
        };

        const { error: assignmentError } = await supabase
          .from('tutor_student_assignments')
          .insert([assignmentData]);

        if (assignmentError) {
          console.error('Erreur lors de l\'assignation tuteur-étudiant:', assignmentError);
        }
      } catch (tutorError) {
        console.error('Erreur lors de la création du tuteur:', tutorError);
      }
    }

    // Send activation email automatically
    await sendActivationEmail(data, establishmentId);

    return data;
  },

  async updateUser(id: string, userData: Partial<CreateUserData>, formationIds?: string[]): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour les formations si fournies
    if (formationIds !== undefined) {
      // Supprimer les anciennes assignations
      const { error: deleteError } = await supabase
        .from('user_formation_assignments')
        .delete()
        .eq('user_id', id);

      if (deleteError) throw deleteError;

      // Ajouter les nouvelles assignations
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
    // Get the current user's establishment_id
    const establishmentId = await getCurrentUserEstablishmentId();

    // Éviter les doublons d'emails pour ne pas faire échouer tout l'import
    const emails = usersData.map((u) => u.email);

    const { data: existingUsers, error: existingError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', emails);

    if (existingError) {
      console.error('Erreur lors de la vérification des emails existants:', existingError);
    }

    const existingEmailSet = new Set((existingUsers || []).map((u) => u.email));

    const usersToInsert = usersData.filter((u) => !existingEmailSet.has(u.email));

    if (usersToInsert.length === 0) {
      throw new Error("Aucun utilisateur importé : tous les emails du fichier existent déjà dans la base.");
    }

    const usersWithEstablishment = usersToInsert.map((user) => ({
      ...user,
      establishment_id: establishmentId,
      is_activated: false,
      status: 'En attente' as const
    }));

    const { data, error } = await supabase
      .from('users')
      .insert(usersWithEstablishment)
      .select();

    if (error) throw error;

    // Send activation emails to all created users
    if (data && data.length > 0) {
      console.log(`Sending activation emails to ${data.length} users...`);
      
      // Send emails in parallel but don't block on failures
      const emailPromises = data.map(user => sendActivationEmail(user, establishmentId));
      await Promise.allSettled(emailPromises);
      
      console.log('Activation emails sent for bulk import');
    }

    return data || [];
  },

  // Resend activation email for a specific user
  async resendActivationEmail(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    const establishmentId = await getCurrentUserEstablishmentId();
    await sendActivationEmail(user, establishmentId);
  }
};
