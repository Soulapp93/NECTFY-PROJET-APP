import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building, ArrowLeft, ArrowRight, Check, Mail, Phone, User, MapPin, 
  FileText, Users, Globe, Eye, EyeOff, Loader2, ShieldCheck, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

// Validation schemas
const establishmentSchema = z.object({
  establishmentName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  establishmentType: z.string().min(1, 'Veuillez sélectionner un type d\'établissement'),
  address: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  numberOfStudents: z.string().optional(),
  numberOfInstructors: z.string().optional(),
  siret: z.string().optional(),
  director: z.string().optional(),
  website: z.string().url('URL invalide').optional().or(z.literal('')),
  establishmentPhone: z.string().optional(),
  establishmentEmail: z.string().email('Email invalide').optional().or(z.literal(''))
});

const adminSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().min(10, 'Numéro de téléphone invalide').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

const CreateEstablishment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    establishmentName: '',
    establishmentType: '',
    address: '',
    numberOfStudents: '',
    numberOfInstructors: '',
    siret: '',
    director: '',
    website: '',
    establishmentPhone: '',
    establishmentEmail: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const establishmentTypes = [
    { value: 'ecole_superieure', label: 'École supérieure', icon: '🎓' },
    { value: 'centre_formation', label: 'Centre de formation', icon: '📚' },
    { value: 'organisme_formation', label: 'Organisme de formation', icon: '🏢' },
    { value: 'universite', label: 'Université', icon: '🏛️' },
    { value: 'entreprise', label: 'Entreprise', icon: '💼' },
    { value: 'formateur_independant', label: 'Formateur indépendant', icon: '👨‍🏫' }
  ];

  const userRanges = ['1-10', '11-25', '26-50', '51-100', '101-500', '500+'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 5);
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Excellent'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500'];

  const validateStep1 = () => {
    const result = establishmentSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const result = adminSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-establishment', {
        body: {
          establishment: {
            name: formData.establishmentName,
            type: establishmentTypes.find(t => t.value === formData.establishmentType)?.label || formData.establishmentType,
            email: formData.establishmentEmail || formData.email,
            address: formData.address,
            phone: formData.establishmentPhone,
            website: formData.website,
            siret: formData.siret,
            director: formData.director,
            numberOfStudents: formData.numberOfStudents,
            numberOfInstructors: formData.numberOfInstructors
          },
          admin: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
          }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erreur lors de la création');

      // Auto-login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (signInError) {
        toast.success('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setTimeout(() => navigate('/auth'), 1500);
      } else {
        toast.success('Bienvenue ! Votre espace établissement est prêt.');
        setTimeout(() => navigate('/dashboard'), 1000);
      }

    } catch (error: any) {
      console.error('Error creating establishment:', error);
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-50 to-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">NF</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                NECTFORMA
              </h1>
            </Link>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Déjà un compte ? <span className="font-medium text-primary">Se connecter</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8">
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Step 1 */}
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                step > 1 ? 'bg-green-500 text-white' : step === 1 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted'
              }`}>
                {step > 1 ? <Check className="h-5 w-5" /> : <Building className="h-5 w-5" />}
              </div>
              <span className="ml-2 font-medium text-sm sm:text-base hidden sm:inline">Établissement</span>
            </div>
            
            {/* Connector */}
            <div className={`w-12 sm:w-20 h-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            
            {/* Step 2 */}
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                step === 2 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-muted'
              }`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="ml-2 font-medium text-sm sm:text-base hidden sm:inline">Administrateur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-100 p-6 sm:p-8 text-center border-b border-border">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-lg mb-4">
              {step === 1 ? (
                <Building className="h-8 w-8 text-primary" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-primary" />
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {step === 1 ? 'Informations de l\'établissement' : 'Administrateur principal'}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              {step === 1 
                ? 'Étape 1/2 • Renseignez les informations de votre établissement'
                : 'Étape 2/2 • Créez votre compte administrateur'
              }
            </p>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="p-6 sm:p-8 space-y-5">
            {step === 1 ? (
              // Step 1: Establishment Information
              <>
                <div>
                  <Label htmlFor="establishmentName" className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-primary" />
                    Nom de l'établissement <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="establishmentName"
                    type="text"
                    value={formData.establishmentName}
                    onChange={(e) => handleInputChange('establishmentName', e.target.value)}
                    placeholder="Ex: École de Commerce de Paris"
                    className={errors.establishmentName ? 'border-destructive' : ''}
                  />
                  {errors.establishmentName && (
                    <p className="text-sm text-destructive mt-1">{errors.establishmentName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="establishmentType" className="flex items-center gap-2 mb-2">
                    Type d'établissement <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {establishmentTypes.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('establishmentType', type.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          formData.establishmentType === type.value
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-xl mb-1 block">{type.icon}</span>
                        <span className="text-xs sm:text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.establishmentType && (
                    <p className="text-sm text-destructive mt-1">{errors.establishmentType}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Adresse <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`flex w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none ${
                      errors.address ? 'border-destructive' : 'border-input'
                    }`}
                    rows={2}
                    placeholder="Adresse complète de l'établissement"
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numberOfStudents" className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      Nombre d'étudiants
                    </Label>
                    <select
                      id="numberOfStudents"
                      value={formData.numberOfStudents}
                      onChange={(e) => handleInputChange('numberOfStudents', e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Sélectionnez</option>
                      {userRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="numberOfInstructors" className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      Nombre de formateurs
                    </Label>
                    <select
                      id="numberOfInstructors"
                      value={formData.numberOfInstructors}
                      onChange={(e) => handleInputChange('numberOfInstructors', e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Sélectionnez</option>
                      {userRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siret" className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      N° SIRET
                    </Label>
                    <Input
                      id="siret"
                      type="text"
                      value={formData.siret}
                      onChange={(e) => handleInputChange('siret', e.target.value)}
                      placeholder="12345678901234"
                      maxLength={14}
                    />
                  </div>

                  <div>
                    <Label htmlFor="director" className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-primary" />
                      Directeur
                    </Label>
                    <Input
                      id="director"
                      type="text"
                      value={formData.director}
                      onChange={(e) => handleInputChange('director', e.target.value)}
                      placeholder="Nom du directeur"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="establishmentPhone" className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Téléphone
                    </Label>
                    <Input
                      id="establishmentPhone"
                      type="tel"
                      value={formData.establishmentPhone}
                      onChange={(e) => handleInputChange('establishmentPhone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  <div>
                    <Label htmlFor="establishmentEmail" className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email de contact
                    </Label>
                    <Input
                      id="establishmentEmail"
                      type="email"
                      value={formData.establishmentEmail}
                      onChange={(e) => handleInputChange('establishmentEmail', e.target.value)}
                      placeholder="contact@etablissement.fr"
                      className={errors.establishmentEmail ? 'border-destructive' : ''}
                    />
                    {errors.establishmentEmail && (
                      <p className="text-sm text-destructive mt-1">{errors.establishmentEmail}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="website" className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Site web
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.votre-etablissement.fr"
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive mt-1">{errors.website}</p>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-border">
                  <Link to="/">
                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour
                    </Button>
                  </Link>
                  <Button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              // Step 2: Administrator Information
              <>
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 mb-2">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">Administrateur Principal</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ce compte aura un accès complet à la gestion de l'établissement et pourra ajouter d'autres administrateurs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom <span className="text-destructive">*</span></Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Votre prénom"
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Nom <span className="text-destructive">*</span></Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Votre nom"
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email professionnel <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="votre@email.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Cet email sera utilisé pour vous connecter
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password}</p>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? strengthColors[passwordStrength] : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength >= 3 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        Force: {strengthLabels[passwordStrength]}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Retapez votre mot de passe"
                      className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Les mots de passe correspondent
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-border">
                  <Button type="button" variant="outline" onClick={handleBack} className="w-full sm:w-auto">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        Créer mon établissement
                        <Check className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Trust badges */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>Données sécurisées</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              <span>Sans engagement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEstablishment;
