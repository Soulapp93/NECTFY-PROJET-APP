import React, { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import ProfileSettings from '../components/compte/ProfileSettings';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { userService } from '@/services/userService';
import { fileUploadService } from '@/services/fileUploadService';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';

const Compte = () => {
  const { userId } = useCurrentUser();

  // État pour les données de profil utilisateur
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePhotoUrl: undefined as string | undefined
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Charger les données utilisateur au montage du composant
  useEffect(() => {
    const loadUserData = async () => {
      if (userId) {
        try {
          const userData = await userService.getUserById(userId);
          setProfileData({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            profilePhotoUrl: userData.profile_photo_url
          });
        } catch (error) {
          console.error('Erreur lors du chargement des données utilisateur:', error);
          toast.error('Erreur lors du chargement du profil');
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
        setIsLoadingProfile(false);
      }
    };

    loadUserData();
  }, [userId]);


  const handleProfilePhotoUpload = async (files: File[]) => {
    if (files.length > 0 && userId) {
      const file = files[0];
      try {
        // Uploader le fichier vers Supabase Storage avec l'ID utilisateur
        const uploadedUrl = await fileUploadService.uploadFile(file, 'avatars', userId);
        
        // Mettre à jour l'état local
        setProfileData(prev => ({ ...prev, profilePhotoUrl: uploadedUrl }));
        
        // Sauvegarder immédiatement dans la base de données
        const currentUser = await userService.getUserById(userId);
        await userService.updateUser(userId, {
          first_name: currentUser.first_name,
          last_name: currentUser.last_name,
          email: currentUser.email,
          phone: currentUser.phone,
          profile_photo_url: uploadedUrl,
          role: currentUser.role,
          status: currentUser.status
        });
        
        toast.success('Photo de profil sauvegardée avec succès');
      } catch (error) {
        console.error('Erreur lors du téléchargement de la photo:', error);
        toast.error('Erreur lors du téléchargement de la photo');
      }
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
      // D'abord récupérer les données actuelles de l'utilisateur pour préserver le rôle et statut
      const currentUser = await userService.getUserById(userId);
      
      await userService.updateUser(userId, {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        profile_photo_url: profileData.profilePhotoUrl,
        role: currentUser.role,
        status: currentUser.status
      });
      toast.success('Profil sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader 
        title="Mon Profil"
        description="Gérez vos informations personnelles et les paramètres de votre profil"
        icon={UserCircle}
      />

      <div className="max-w-4xl">
        <ProfileSettings
          profileData={profileData}
          onProfileDataChange={handleProfileDataChange}
          onPhotoUpload={handleProfilePhotoUpload}
          onSave={handleSaveProfile}
        />
      </div>
    </div>
  );
};

export default Compte;