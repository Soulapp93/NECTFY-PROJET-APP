import { supabase } from '@/integrations/supabase/client';

// Use type assertion for tables not yet in generated types
const db = supabase as any;

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.id;
};

export interface ChatGroup {
  id: string;
  establishment_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  avatar_url: string | null;
  is_private: boolean;
  group_type?: 'establishment' | 'formation' | 'private';
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: ChatMessage;
  member_count?: number;
}

export interface ChatGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url: string | null;
    role: string;
  };
}

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'file' | 'image' | 'system';
  is_edited: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string | null;
    role: string;
  };
  attachments?: ChatMessageAttachment[];
  replied_to_message?: {
    id: string;
    content: string;
    sender?: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

export interface ChatMessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  content_type?: string | null;
  created_at: string;
}

export const chatService = {
  // Get all groups for current user
  async getUserGroups(): Promise<ChatGroup[]> {
    const userId = await getCurrentUserId();
    
    // Get groups where user is a member
    const { data: memberGroups, error: memberError } = await db
      .from('chat_group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;
    
    if (!memberGroups || memberGroups.length === 0) {
      return [];
    }

    const groupIds = memberGroups.map((m: any) => m.group_id);
    
    const { data: groups, error: groupsError } = await db
      .from('chat_groups')
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (groupsError) throw groupsError;

    // Get member count for each group
    const groupsWithCounts = await Promise.all(
      (groups || []).map(async (group: any) => {
        const { count } = await db
          .from('chat_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);
        
        return {
          ...group,
          member_count: count || 0
        };
      })
    );

    return groupsWithCounts as ChatGroup[];
  },

  // Get group by ID with details
  async getGroupById(groupId: string): Promise<ChatGroup | null> {
    const { data, error } = await db
      .from('chat_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as ChatGroup;
  },

  // Get group members
  async getGroupMembers(groupId: string): Promise<ChatGroupMember[]> {
    const { data, error } = await db
      .from('chat_group_members')
      .select(`
        id,
        group_id,
        user_id,
        role,
        joined_at
      `)
      .eq('group_id', groupId);

    if (error) throw error;

    // Fetch user details separately
    const membersWithUsers = await Promise.all(
      (data || []).map(async (member: any) => {
        const { data: userData } = await db
          .from('users')
          .select('id, first_name, last_name, email, profile_photo_url, role')
          .eq('id', member.user_id)
          .single();
        
        return {
          ...member,
          user: userData
        };
      })
    );

    return membersWithUsers as ChatGroupMember[];
  },

  // Create a new group
  async createGroup(groupData: {
    name: string;
    description?: string;
    member_ids: string[];
    is_private?: boolean;
  }): Promise<ChatGroup> {
    const userId = await getCurrentUserId();
    
    // Get user's establishment
    const { data: context } = await supabase.rpc('get_my_context');
    const establishmentId = (context as any)?.user?.establishment_id;
    
    if (!establishmentId) {
      throw new Error('User establishment not found');
    }

    // Create the group
    const { data: group, error: groupError } = await db
      .from('chat_groups')
      .insert({
        name: groupData.name,
        description: groupData.description || null,
        establishment_id: establishmentId,
        created_by: userId,
        is_private: groupData.is_private || false
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin
    const members = [
      { group_id: group.id, user_id: userId, role: 'admin' },
      ...groupData.member_ids
        .filter(id => id !== userId)
        .map(id => ({ group_id: group.id, user_id: id, role: 'member' }))
    ];

    const { error: membersError } = await db
      .from('chat_group_members')
      .insert(members);

    if (membersError) throw membersError;

    return group as ChatGroup;
  },

  // Get messages for a group
  async getGroupMessages(groupId: string, limit: number = 50): Promise<ChatMessage[]> {
    const { data, error } = await db
      .from('chat_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch sender details
    const messagesWithSenders = await Promise.all(
      (data || []).map(async (message: any) => {
        const { data: senderData } = await db
          .from('users')
          .select('id, first_name, last_name, profile_photo_url, role')
          .eq('id', message.sender_id)
          .single();
        
        // Get attachments
        const { data: attachments } = await db
          .from('chat_message_attachments')
          .select('*')
          .eq('message_id', message.id);
        
        return {
          ...message,
          sender: senderData,
          attachments: attachments || []
        };
      })
    );

    // Return in chronological order
    return messagesWithSenders.reverse() as ChatMessage[];
  },

  // Send a message
  async sendMessage(groupId: string, content: string, messageType: 'text' | 'file' | 'image' = 'text'): Promise<ChatMessage> {
    const userId = await getCurrentUserId();

    const { data, error } = await db
      .from('chat_messages')
      .insert({
        group_id: groupId,
        sender_id: userId,
        content,
        message_type: messageType
      })
      .select()
      .single();

    if (error) throw error;

    // Update group's updated_at
    await db
      .from('chat_groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    return data as ChatMessage;
  },

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await db
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  },

  // Upload attachment
  async uploadAttachment(messageId: string, file: File): Promise<ChatMessageAttachment> {
    const fileExt = file.name.split('.').pop();
    const fileName = `chat/${messageId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('module-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('module-files')
      .getPublicUrl(fileName);

    const { data, error } = await db
      .from('chat_message_attachments')
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type
      })
      .select()
      .single();

    if (error) throw error;
    return data as ChatMessageAttachment;
  },

  // Add members to group
  async addMembers(groupId: string, userIds: string[]): Promise<void> {
    const members = userIds.map(userId => ({
      group_id: groupId,
      user_id: userId,
      role: 'member'
    }));

    const { error } = await db
      .from('chat_group_members')
      .insert(members);

    if (error) throw error;
  },

  // Remove member from group
  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await db
      .from('chat_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Subscribe to new messages (realtime)
  subscribeToMessages(groupId: string, callback: (message: ChatMessage) => void) {
    const channel = supabase
      .channel(`chat_messages_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // Fetch sender info
          const { data: senderData } = await db
            .from('users')
            .select('id, first_name, last_name, profile_photo_url, role')
            .eq('id', payload.new.sender_id)
            .single();
          
          callback({
            ...payload.new,
            sender: senderData
          } as ChatMessage);
        }
      )
      .subscribe();

    return channel;
  },

  // Leave group
  async leaveGroup(groupId: string): Promise<void> {
    const userId = await getCurrentUserId();
    
    const { error } = await db
      .from('chat_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Update group
  async updateGroup(groupId: string, updates: { name?: string; description?: string; avatar_url?: string }): Promise<ChatGroup> {
    const { data, error } = await db
      .from('chat_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data as ChatGroup;
  },

  // Delete group
  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await db
      .from('chat_groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
  },

  // Update last read (stub - no last_read_at column in chat_group_members)
  async updateLastRead(groupId: string): Promise<void> {
    // This is a placeholder - the column doesn't exist yet
    console.log('updateLastRead called for group:', groupId);
  }
};
