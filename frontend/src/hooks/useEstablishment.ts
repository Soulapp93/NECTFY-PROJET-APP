import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from './useCurrentUser';

interface Establishment {
  id: string;
  name: string;
  logo_url: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  type: string;
  director: string | null;
  siret: string | null;
}

export const useEstablishment = () => {
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useCurrentUser();

  useEffect(() => {
    const fetchEstablishment = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // Get the user's establishment_id - d'abord dans users, puis dans tutors
        let establishmentId: string | null = null;
        
        const { data: userData } = await supabase
          .from('users')
          .select('establishment_id')
          .eq('id', userId)
          .maybeSingle();

        if (userData?.establishment_id) {
          establishmentId = userData.establishment_id;
        } else {
          // Vérifier dans la table tutors
          const { data: tutorData } = await supabase
            .from('tutors')
            .select('establishment_id')
            .eq('id', userId)
            .maybeSingle();
          
          if (tutorData?.establishment_id) {
            establishmentId = tutorData.establishment_id;
          }
        }

        if (!establishmentId) {
          setLoading(false);
          return;
        }

        // Get the establishment details
        const { data: establishmentData, error: establishmentError } = await supabase
          .from('establishments')
          .select('*')
          .eq('id', establishmentId)
          .single();

        if (establishmentError) {
          console.error('Error fetching establishment:', establishmentError);
          setLoading(false);
          return;
        }

        setEstablishment(establishmentData);
      } catch (error) {
        console.error('Error in useEstablishment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishment();
  }, [userId]);

  return { establishment, loading };
};
