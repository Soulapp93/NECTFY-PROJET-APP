import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import EstablishmentSettings from '../components/compte/EstablishmentSettings';
import { toast } from 'sonner';
import { establishmentService, Establishment } from '@/services/establishmentService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';

type EstablishmentDataState = {
  name: string;
  phone: string;
  website: string;
  address: string;
  type: string;
  director: string;
  siret: string;
  numberOfUsers: number;
  logoUrl?: string;
};

const GestionEtablissement = () => {
  const { userId, userRole } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    personalAddress: ''
  });

  const [establishmentData, setEstablishmentData] = useState<EstablishmentDataState>({
    name: '',
    phone: '',
    website: '',
    address: '',
    type: '',
    director: '',
    siret: '',
    numberOfUsers: 0
  });

  // Charger les données de l'établissement depuis Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger l'établissement
        const establishment = await establishmentService.getCurrentUserEstablishment();
        
        if (establishment) {
          setEstablishmentId(establishment.id);
          setEstablishmentData({
            name: establishment.name || '',
            phone: establishment.phone || '',
            website: establishment.website || '',
            address: establishment.address || '',
            type: establishment.type || '',
            director: establishment.director || '',
            siret: establishment.siret || '',
            numberOfUsers: 0,
            logoUrl: establishment.logo_url || undefined
          });
        }

        // Charger les infos de l'admin actuel
        if (userId) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (!error && userData) {
            setAdminData({
              firstName: userData.first_name || '',
              lastName: userData.last_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              role: userData.role || '',
              personalAddress: ''
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  const handleLogoUpload = async (files: File[]) => {
    if (files.length > 0 && establishmentId) {
      const file = files[0];
      
      try {
        // Sanitize filename - remove special characters and accents
        const sanitizedName = file.name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with underscore
        
        // Upload to Supabase storage - use avatars bucket which exists
        const fileName = `establishments/${establishmentId}/${Date.now()}_${sanitizedName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Erreur lors de l\'upload du logo');
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);

        // Update establishment with logo URL immediately
        await establishmentService.updateEstablishment(establishmentId, {
          logo_url: publicUrl
        });

        setEstablishmentData(prev => ({ ...prev, logoUrl: publicUrl }));
        toast.success('Logo mis à jour avec succès - Rechargez la page pour voir le logo dans la sidebar');
      } catch (error) {
        console.error('Erreur upload logo:', error);
        toast.error('Erreur lors de l\'upload du logo');
      }
    }
  };

  const handleSaveEstablishment = async () => {
    if (!establishmentId) {
      toast.error('Établissement non trouvé');
      return;
    }

    try {
      // Mettre à jour l'établissement
      await establishmentService.updateEstablishment(establishmentId, {
        name: establishmentData.name,
        phone: establishmentData.phone,
        website: establishmentData.website,
        address: establishmentData.address,
        type: establishmentData.type,
        director: establishmentData.director,
        siret: establishmentData.siret,
      });

      // Mettre à jour les infos admin si nécessaire
      if (userId) {
        await supabase
          .from('users')
          .update({
            first_name: adminData.firstName,
            last_name: adminData.lastName,
            phone: adminData.phone,
          })
          .eq('id', userId);
      }
      
      toast.success('Informations sauvegardées avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des informations');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Vérifier que l'utilisateur est admin
  if (userRole !== 'Admin' && userRole !== 'AdminPrincipal') {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Vous n'avez pas les droits pour accéder à cette page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-primary/20">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Gestion de l'établissement</h1>
        </div>
        <p className="text-muted-foreground ml-16">Gérez les informations de l'établissement et les paramètres administrateur</p>
      </div>

      <div className="max-w-4xl">
        <EstablishmentSettings
          adminData={adminData}
          establishmentData={establishmentData}
          onAdminDataChange={setAdminData}
          onEstablishmentDataChange={setEstablishmentData}
          onLogoUpload={handleLogoUpload}
          onSave={handleSaveEstablishment}
        />
      </div>
    </div>
  );
};

export default GestionEtablissement;
