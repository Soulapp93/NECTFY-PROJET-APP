import { supabase } from '@/integrations/supabase/client';

export interface Invitation {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  token: string;
  establishment_id: string;
  created_by?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationData {
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'Admin' | 'Formateur' | 'Étudiant';
}

export const invitationService = {
  async sendInvitation(data: CreateInvitationData): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user session (needed because send-invitation requires JWT)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id || !session.access_token) {
        throw new Error('Utilisateur non connecté');
      }

      // Get user's establishment_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('establishment_id')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData?.establishment_id) {
        throw new Error('Établissement non trouvé');
      }

      // Call edge function to send invitation (explicit Authorization header)
      const { data: response, error } = await supabase.functions.invoke('send-invitation', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          ...data,
          establishment_id: userData.establishment_id,
          created_by: session.user.id,
        },
      });

      if (error) throw error;
      if (response?.error) throw new Error(response.error);

      return { success: true };
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      return { success: false, error: error.message };
    }
  },

  async getInvitations(): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Invitation[];
  },

  async cancelInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' as any })
      .eq('id', invitationId);

    if (error) throw error;
  },

  async resendInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invitation non trouvée');
      }

      // Cancel old invitation
      await this.cancelInvitation(invitationId);

      // Create new invitation with same details
      return await this.sendInvitation({
        email: invitation.email,
        first_name: invitation.first_name || undefined,
        last_name: invitation.last_name || undefined,
        role: invitation.role as 'Admin' | 'Formateur' | 'Étudiant'
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
