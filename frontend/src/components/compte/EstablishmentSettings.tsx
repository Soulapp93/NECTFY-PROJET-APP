import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import FileUpload from '../ui/file-upload';
import { Building2, User, Phone, Globe, MapPin, Users, FileText, Mail, Upload } from 'lucide-react';

interface AdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  personalAddress: string;
}

interface EstablishmentData {
  name: string;
  phone: string;
  website: string;
  address: string;
  type: string;
  director: string;
  siret: string;
  numberOfUsers: number;
  logoUrl?: string;
}

interface EstablishmentSettingsProps {
  adminData: AdminData;
  establishmentData: EstablishmentData;
  onAdminDataChange: (data: AdminData) => void;
  onEstablishmentDataChange: (data: EstablishmentData) => void;
  onLogoUpload: (files: File[]) => void;
  onSave: () => void;
}

const EstablishmentSettings: React.FC<EstablishmentSettingsProps> = ({
  adminData,
  establishmentData,
  onAdminDataChange,
  onEstablishmentDataChange,
  onLogoUpload,
  onSave
}) => {
  const handleAdminChange = (field: keyof AdminData, value: string) => {
    onAdminDataChange({ ...adminData, [field]: value });
  };

  const handleEstablishmentChange = (field: keyof EstablishmentData, value: string | number) => {
    onEstablishmentDataChange({ ...establishmentData, [field]: value });
  };

  return (
    <div className="bg-background rounded-2xl shadow-lg border-2 border-primary/20 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-3">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          Gestion de l'établissement
        </h2>
        <p className="text-muted-foreground ml-12">
          Gérez les informations de l'administrateur principal et de l'établissement
        </p>
      </div>

      {/* Informations personnelles de l'administrateur */}
      <div className="mb-8 bg-muted/30 rounded-xl p-6 border-2 border-primary/10">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-primary" />
          Informations personnelles de l'administrateur principal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={adminData.firstName}
              onChange={(e) => handleAdminChange('firstName', e.target.value)}
              className="mt-1.5"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={adminData.lastName}
              onChange={(e) => handleAdminChange('lastName', e.target.value)}
              className="mt-1.5"
            />
          </div>
          
          <div>
            <Label htmlFor="adminEmail">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-primary/60" />
              <Input
                id="adminEmail"
                type="email"
                value={adminData.email}
                onChange={(e) => handleAdminChange('email', e.target.value)}
                className="pl-10"
                placeholder="admin@exemple.com"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="adminPhone">Téléphone</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-3.5 h-4 w-4 text-primary/60" />
              <Input
                id="adminPhone"
                value={adminData.phone}
                onChange={(e) => handleAdminChange('phone', e.target.value)}
                className="pl-10"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="role">Rôle/Poste dans l'établissement</Label>
            <Input
              id="role"
              value={adminData.role}
              onChange={(e) => handleAdminChange('role', e.target.value)}
              className="mt-1.5"
              placeholder="Ex: Directeur, Responsable pédagogique..."
            />
          </div>
          
          <div className="md:col-span-2">
            <Label htmlFor="personalAddress">Adresse personnelle</Label>
            <Input
              id="personalAddress"
              value={adminData.personalAddress}
              onChange={(e) => handleAdminChange('personalAddress', e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <Separator className="my-8 bg-primary/10" />

      {/* Informations de l'établissement */}
      <div className="mb-8 bg-muted/30 rounded-xl p-6 border-2 border-primary/10">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-primary" />
          Informations de l'établissement
        </h3>
        
        <div className="space-y-6">
          {/* Logo de l'établissement */}
          <div>
            <Label>Logo de l'établissement</Label>
            <div className="mt-2 flex items-center gap-4">
              {establishmentData.logoUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={establishmentData.logoUrl}
                    alt="Logo de l'établissement"
                    className="h-16 w-16 object-contain rounded-xl border-2 border-primary/20"
                  />
                </div>
              )}
              <div className="flex-1">
                <FileUpload
                  onFileSelect={onLogoUpload}
                  accept="image/*"
                  maxSize={5}
                  className="border-2 border-dashed border-primary/30 rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="establishmentName">Nom de l'établissement</Label>
              <Input
                id="establishmentName"
                value={establishmentData.name}
                onChange={(e) => handleEstablishmentChange('name', e.target.value)}
                className="mt-1.5"
              />
            </div>
          
          <div>
            <Label htmlFor="establishmentPhone">Téléphone</Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-3.5 h-4 w-4 text-primary/60" />
              <Input
                id="establishmentPhone"
                value={establishmentData.phone}
                onChange={(e) => handleEstablishmentChange('phone', e.target.value)}
                className="pl-10"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="website">Site web</Label>
            <div className="relative mt-1.5">
              <Globe className="absolute left-3 top-3.5 h-4 w-4 text-primary/60" />
              <Input
                id="website"
                value={establishmentData.website}
                onChange={(e) => handleEstablishmentChange('website', e.target.value)}
                className="pl-10"
                placeholder="www.exemple.com"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="establishmentAddress">Adresse de l'établissement</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-primary/60" />
              <Input
                id="establishmentAddress"
                value={establishmentData.address}
                onChange={(e) => handleEstablishmentChange('address', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="establishmentType">Type d'établissement</Label>
            <Input
              id="establishmentType"
              value={establishmentData.type}
              onChange={(e) => handleEstablishmentChange('type', e.target.value)}
              className="mt-1.5"
              placeholder="Ex: École supérieure, Centre de formation..."
            />
          </div>
          
          <div>
            <Label htmlFor="director">Directeur</Label>
            <Input
              id="director"
              value={establishmentData.director}
              onChange={(e) => handleEstablishmentChange('director', e.target.value)}
              className="mt-1.5"
            />
          </div>
          
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <div className="relative mt-1.5">
              <FileText className="absolute left-3 top-3.5 h-4 w-4 text-primary/60" />
              <Input
                id="siret"
                value={establishmentData.siret}
                onChange={(e) => handleEstablishmentChange('siret', e.target.value)}
                className="pl-10"
                placeholder="12345678901234"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="numberOfUsers">Nombre d'utilisateurs</Label>
            <div className="relative mt-1.5">
              <Users className="absolute left-3 top-3.5 h-4 w-4 text-primary/60" />
              <Input
                id="numberOfUsers"
                type="number"
                value={establishmentData.numberOfUsers}
                onChange={(e) => handleEstablishmentChange('numberOfUsers', parseInt(e.target.value) || 0)}
                className="pl-10"
                min="1"
              />
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave} className="px-8 rounded-xl">
          Sauvegarder les modifications
        </Button>
      </div>
    </div>
  );
};

export default EstablishmentSettings;