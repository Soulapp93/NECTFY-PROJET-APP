import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AllUserFormationAssignment {
  id: string;
  user_id: string;
  formation_id: string;
  assigned_at: string;
  formation: {
    id: string;
    title: string;
    level: string;
    color?: string | null;
  };
}

/**
 * Charge les inscriptions aux formations pour une liste d'utilisateurs (usage admin / liste).
 */
export const useAllUserFormations = (userIds: string[]) => {
  const [assignments, setAssignments] = useState<AllUserFormationAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ids = useMemo(() => userIds.filter(Boolean), [userIds]);

  const fetchAll = async () => {
    if (ids.length === 0) {
      setAssignments([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_formation_assignments")
        .select(
          `
          id,
          user_id,
          formation_id,
          assigned_at,
          formation:formations(id, title, level, color)
        `
        )
        .in("user_id", ids);

      if (error) throw error;
      setAssignments((data as any) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des formations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  const getUserFormations = (userId: string) => assignments.filter((a) => a.user_id === userId);

  return { assignments, loading, error, getUserFormations, refetch: fetchAll };
};
