import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

/**
 * Hook moderne qui utilise une RPC SECURITY DEFINER pour récupérer
 * tout le contexte utilisateur en une seule requête sécurisée.
 * 
 * - Pour les étudiants: retourne les infos de leur tuteur
 * - Pour les tuteurs: retourne les infos de leur apprenti
 * - Contourne les problèmes RLS côté client
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
        setLoading(false);
        return;
      }

      // Appeler la RPC SECURITY DEFINER
      const { data: contextData, error: rpcError } = await supabase.rpc('get_my_context');

      if (rpcError) {
        console.error('Erreur get_my_context:', rpcError);
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      // Cast vers le type attendu
      const ctx = contextData as unknown as {
        user: UserContext | null | 'null';
        relation: RelationContext | null | 'null';
        establishment: EstablishmentContext | null | 'null';
        role: string | null;
        error?: string;
      };

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
    } catch (err) {
      console.error('Erreur useMyContext:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch initial
    fetchContext();

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
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchContext]);

  return {
    ...data,
    loading,
    error,
    refetch: fetchContext
  };
};
