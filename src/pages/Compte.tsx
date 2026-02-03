import React, { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import ProfileSettings from '../components/compte/ProfileSettings';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import { fileUploadService } from '@/services/fileUploadService';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';

interface ProfileApiResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_photo_url?: string;
  role: string;
  status: string;
  establishment_id: string;
  is_activated?: boolean;
  error?: string;
}

const Compte = () => {
  const { userId, userRole } = useCurrentUser();

  // État pour les données de profil utilisateur
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePhotoUrl: undefined as string | undefined
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  // Charger les données utilisateur via la fonction RPC sécurisée
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        // Utiliser la fonction RPC SECURITY DEFINER pour contourner les RLS
        const { data, error } = await supabase.rpc('get_my_profile');

        if (error) {
          console.error('Erreur get_my_profile:', error);
          toast.error('Erreur lors du chargement du profil');
          setIsLoadingProfile(false);
          return;
        }

        const userData = data as unknown as ProfileApiResponse;

        if (userData?.error) {
          console.error('Erreur dans les données profil:', userData.error);
          toast.error('Erreur lors du chargement du profil');
          setIsLoadingProfile(false);
          return;
        }

        if (userData) {
          setProfileData({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            profilePhotoUrl: userData.profile_photo_url
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        toast.error('Erreur lors du chargement du profil');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserData();
  }, [userId]);


  const handleProfilePhotoUpload = async (files: File[]) => {
    if (files.length > 0 && userId) {
      const file = files[0];
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image (JPG, PNG)');
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }
      
      setIsUploadingPhoto(true);
      
      try {
        // Uploader le fichier vers Supabase Storage avec l'ID utilisateur
        const uploadedUrl = await fileUploadService.uploadFile(file, 'avatars', userId);
        
        console.log('Photo uploadée avec succès:', uploadedUrl);
        
        // Déterminer quelle table mettre à jour
        if (userRole === 'Tuteur') {
          // Mise à jour pour les tuteurs
          const { error } = await supabase
            .from('tutors')
            .update({ profile_photo_url: uploadedUrl })
            .eq('id', userId);

          if (error) throw error;
        } else {
          // Mise à jour pour les autres utilisateurs
          const { error } = await supabase
            .from('users')
            .update({ profile_photo_url: uploadedUrl })
            .eq('id', userId);

          if (error) throw error;
        }
        
        // Mettre à jour l'état local APRÈS la sauvegarde en base
        setProfileData(prev => ({ ...prev, profilePhotoUrl: uploadedUrl }));
        
        toast.success('Photo de profil mise à jour avec succès');
      } catch (error) {
        console.error('Erreur lors du téléchargement de la photo:', error);
        toast.error('Erreur lors du téléchargement de la photo');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleProfilePhotoDelete = async () => {
    if (!userId) return;
    
    setIsDeletingPhoto(true);
    
    try {
      // Supprimer l'URL de la photo dans la base de données
      if (userRole === 'Tuteur') {
        const { error } = await supabase
          .from('tutors')
          .update({ profile_photo_url: null })
          .eq('id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('users')
          .update({ profile_photo_url: null })
          .eq('id', userId);

        if (error) throw error;
      }
      
      // Mettre à jour l'état local
      setProfileData(prev => ({ ...prev, profilePhotoUrl: undefined }));
      
      toast.success('Photo de profil supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
      toast.error('Erreur lors de la suppression de la photo');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleProfileDataChange = (data: { firstName: string; lastName: string; email: string; phone: string; profilePhotoUrl?: string }) => {
    setProfileData({
      ...data,
      profilePhotoUrl: data.profilePhotoUrl
    });
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      toast.error('Utilisateur non connecté');
      return;
    }

    try {
      if (userRole === 'Tuteur') {
        // Mise à jour pour les tuteurs
        const { error } = await supabase
          .from('tutors')
          .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            profile_photo_url: profileData.profilePhotoUrl
          })
          .eq('id', userId);

        if (error) throw error;
      } else {
        // Mise à jour pour les autres utilisateurs
        const { error } = await supabase
          .from('users')
          .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            profile_photo_url: profileData.profilePhotoUrl
          })
          .eq('id', userId);

        if (error) throw error;
      }
      
      toast.success('Profil sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                  Mon profil
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                  Gérez vos informations personnelles et les paramètres de votre profil
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">

      <div className="max-w-4xl">
        <ProfileSettings
          profileData={profileData}
          onProfileDataChange={handleProfileDataChange}
          onPhotoUpload={handleProfilePhotoUpload}
          onPhotoDelete={handleProfilePhotoDelete}
          onSave={handleSaveProfile}
          isUploadingPhoto={isUploadingPhoto}
          isDeletingPhoto={isDeletingPhoto}
        />
      </div>
      </div>
    </div>
  );
};

export default Compte;