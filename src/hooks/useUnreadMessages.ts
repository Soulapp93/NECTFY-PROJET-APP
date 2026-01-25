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
      // For now, just set counts to 0 since the messaging tables may not exist yet
      // This is a placeholder until the full messaging system is implemented
      setCounts({
        messagerie: 0,
        groupes: 0,
        total: 0,
      });
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
  }, [userId]);

  return {
    counts,
    loading,
    refetch: fetchUnreadCounts,
  };
};
