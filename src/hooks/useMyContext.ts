import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { rpcWithRetry } from '@/lib/supabaseRetry';

export interface UserContext {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_photo_url?: string;
  role: string;
  company_name?: string;
  position?: string;
  establishment_id: string;
}

export interface RelationContext {
  type: 'tutor' | 'student';
  id: string;
  name: string;
  email?: string;
  company?: string;
  position?: string;
}

export interface EstablishmentContext {
  id: string;
  name: string;
  logo_url?: string;
}

export interface MyContextData {
  user: UserContext | null;
  relation: RelationContext | null;
  establishment: EstablishmentContext | null;
  role: string | null;
}

interface ContextResponse {
  user: UserContext | null | 'null';
  relation: RelationContext | null | 'null';
  establishment: EstablishmentContext | null | 'null';
  role: string | null;
  error?: string;
}

/**
 * Hook moderne qui utilise une RPC SECURITY DEFINER pour récupérer
 * tout le contexte utilisateur en une seule requête sécurisée.
 * 
 * - Pour les étudiants: retourne les infos de leur tuteur
 * - Pour les tuteurs: retourne les infos de leur apprenti
 * - Contourne les problèmes RLS côté client
 * - Inclut retry automatique pour les erreurs réseau transitoires
 * - Écoute les changements en temps réel sur users et tutors
 */
export const useMyContext = () => {
  const [data, setData] = useState<MyContextData>({
    user: null,
    relation: null,
    establishment: null,
    role: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const userIdRef = useRef<string | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier si l'utilisateur est connecté
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setData({
          user: null,
          relation: null,
          establishment: null,
          role: null
        });
        userIdRef.current = null;
        setLoading(false);
        return;
      }

      userIdRef.current = sessionData.session.user.id;

      // Appeler la RPC SECURITY DEFINER avec retry
      const { data: contextData, error: rpcError } = await rpcWithRetry(
        () => supabase.rpc('get_my_context'),
        {
          maxRetries: 3,
          baseDelayMs: 500,
          onRetry: (attempt, err) => {
            console.warn(`Retry attempt ${attempt} for get_my_context:`, err.message);
          }
        }
      );

      if (rpcError) {
        console.error('Erreur get_my_context:', rpcError);
        setError('Erreur de chargement du contexte');
        setLoading(false);
        return;
      }

      // Cast vers le type attendu
      const ctx = contextData as unknown as ContextResponse | null;

      if (!ctx || ctx.error) {
        console.error('Contexte invalide:', ctx);
        setError(ctx?.error || 'Contexte non disponible');
        setLoading(false);
        return;
      }

      // Parser les données JSON retournées
      const parsed: MyContextData = {
        user: ctx.user && ctx.user !== 'null' ? ctx.user : null,
        relation: ctx.relation && ctx.relation !== 'null' ? ctx.relation : null,
        establishment: ctx.establishment && ctx.establishment !== 'null' ? ctx.establishment : null,
        role: ctx.role || null
      };

      setData(parsed);
      setError(null);
    } catch (err) {
      console.error('Erreur useMyContext après retries:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup realtime subscription for profile updates
  useEffect(() => {
    // Fetch initial
    fetchContext();

    // Subscribe to realtime changes on users and tutors tables for profile updates
    const channel = supabase
      .channel('profile-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          // Only refetch if the update is for the current user
          if (userIdRef.current && payload.new && (payload.new as any).id === userIdRef.current) {
            console.log('User profile realtime update detected');
            fetchContext();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tutors'
        },
        (payload) => {
          // Only refetch if the update is for the current tutor
          if (userIdRef.current && payload.new && (payload.new as any).id === userIdRef.current) {
            console.log('Tutor profile realtime update detected');
            fetchContext();
          }
        }
      )
      .subscribe((status) => {
        console.log('Profile realtime subscription status:', status);
      });

    channelRef.current = channel;

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchContext();
      } else if (event === 'SIGNED_OUT') {
        setData({
          user: null,
          relation: null,
          establishment: null,
          role: null
        });
        userIdRef.current = null;
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchContext]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchContext
  };
};
