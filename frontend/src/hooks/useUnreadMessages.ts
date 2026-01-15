import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

interface UnreadCounts {
  messagerie: number;
  groupes: number;
  total: number;
}

export const useUnreadMessages = () => {
  const [counts, setCounts] = useState<UnreadCounts>({ messagerie: 0, groupes: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { userId } = useCurrentUser();

  const fetchUnreadCounts = async () => {
    if (!userId) {
      setCounts({ messagerie: 0, groupes: 0, total: 0 });
      setLoading(false);
      return;
    }

    try {
      // 1. Compter les messages non lus dans la messagerie (non archivés et non supprimés)
      const { data: unreadMessages, error: messagesError } = await supabase
        .from('message_recipients')
        .select('id')
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .eq('is_archived', false)
        .eq('is_deleted', false);

      const messagerieCount = messagesError ? 0 : (unreadMessages?.length || 0);

      // 2. Compter les messages non lus dans les groupes (chat)
      // D'abord récupérer les groupes de l'utilisateur avec leur last_read_at
      const { data: memberships, error: membershipsError } = await supabase
        .from('chat_group_members')
        .select('group_id, last_read_at')
        .eq('user_id', userId);

      let groupesCount = 0;
      if (!membershipsError && memberships && memberships.length > 0) {
        // Pour chaque groupe, compter les messages après last_read_at
        for (const membership of memberships) {
          const lastRead = membership.last_read_at || '1970-01-01T00:00:00Z';
          
          const { count, error: countError } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', membership.group_id)
            .neq('sender_id', userId)
            .gt('created_at', lastRead)
            .eq('is_deleted', false);

          if (!countError && count) {
            groupesCount += count;
          }
        }
      }

      setCounts({
        messagerie: messagerieCount,
        groupes: groupesCount,
        total: messagerieCount + groupesCount,
      });
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();

    // Écouter les nouveaux messages en temps réel
    const messageChannel = supabase
      .channel('unread-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_recipients',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_recipients',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_group_members',
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [userId]);

  return {
    counts,
    loading,
    refetch: fetchUnreadCounts,
  };
};
