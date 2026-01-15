import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '@/services/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, CheckCircle2, AlertCircle, User, LogIn, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import SignaturePad from '@/components/ui/signature-pad';

const SignaturePublique = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceSheet, setAttendanceSheet] = useState<any>(null);
  const [tokenValid, setTokenValid] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  const [hasAlreadySigned, setHasAlreadySigned] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signing, setSigning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, [token]);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      
      // 1. Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // 2. Récupérer les infos de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, role')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        toast.error('Utilisateur non trouvé');
        setLoading(false);
        return;
      }

      setCurrentUser(userData);

      // 3. Valider le token
      const validationData = await attendanceService.validateSignatureToken(token!);
      
      if (!validationData || !validationData.is_valid) {
        setTokenValid({ 
          valid: false, 
          expired: validationData?.expires_at ? new Date(validationData.expires_at) < new Date() : true,
          expires_at: validationData?.expires_at
        });
        setLoading(false);
        return;
      }

      setTokenValid(validationData);

      // 4. Charger la feuille d'émargement
      const sheet = await attendanceService.getAttendanceSheetByToken(token!);
      setAttendanceSheet(sheet);

      // 5. Vérifier que l'utilisateur est inscrit à cette formation (pour étudiants)
      if (userData.role === 'Étudiant') {
        const { data: enrollment } = await supabase
          .from('user_formation_assignments')
          .select('id')
          .eq('user_id', user.id)
          .eq('formation_id', sheet.formation_id)
          .single();

        if (!enrollment) {
          setIsEnrolled(false);
          setLoading(false);
          return;
        }
        setIsEnrolled(true);
      } else if (userData.role === 'Formateur') {
        // Les formateurs peuvent signer s'ils sont assignés à cette session
        setIsEnrolled(sheet.instructor_id === user.id);
      } else {
        // Admins peuvent voir mais pas signer via ce lien
        setIsEnrolled(false);
      }

      // 6. Vérifier si l'utilisateur a déjà signé
      const alreadySigned = sheet.attendance_signatures?.some(
        (sig: any) => sig.user_id === user.id
      );
      setHasAlreadySigned(alreadySigned);

      // 7. Charger la signature enregistrée de l'utilisateur
      const { data: savedSignature } = await supabase
        .from('user_signatures')
        .select('signature_data')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (savedSignature?.signature_data) {
        setUserSignature(savedSignature.signature_data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSignWithSavedSignature = async () => {
    if (!currentUser || !attendanceSheet || !userSignature) return;

    try {
      setSigning(true);

      await attendanceService.signAttendanceSheet(
        attendanceSheet.id,
        currentUser.id,
        currentUser.role === 'Formateur' ? 'instructor' : 'student',
        userSignature
      );

      toast.success('Présence validée avec votre signature enregistrée');
      setHasAlreadySigned(true);
    } catch (error: any) {
      console.error('Error signing:', error);
      toast.error(error.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const handleSignature = async (signatureData: string) => {
    if (!currentUser || !attendanceSheet) return;

    try {
      setSigning(true);

      // Sauvegarder la signature
      await attendanceService.signAttendanceSheet(
        attendanceSheet.id,
        currentUser.id,
        currentUser.role === 'Formateur' ? 'instructor' : 'student',
        signatureData
      );

      // Optionnellement sauvegarder la signature dans le profil
      if (!userSignature) {
        await supabase
          .from('user_signatures')
          .upsert({
            user_id: currentUser.id,
            signature_data: signatureData
          }, {
            onConflict: 'user_id'
          });
        setUserSignature(signatureData);
      }

      toast.success('Présence validée avec succès');
      setHasAlreadySigned(true);
      setShowSignature(false);
    } catch (error: any) {
      console.error('Error signing:', error);
      toast.error(error.message || 'Erreur lors de la signature');
    } finally {
      setSigning(false);
    }
  };

  const handleLogin = () => {
    // Stocker l'URL actuelle pour redirection après login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Non authentifié - demander la connexion
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Connexion requise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vous devez être connecté à votre compte NECTFY pour signer cette feuille d'émargement.
            </p>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token invalide ou expiré
  if (!tokenValid || !tokenValid.is_valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Lien invalide ou expiré
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {tokenValid?.expired 
                ? 'Ce lien d\'émargement a expiré. Veuillez contacter l\'administration.'
                : 'Ce lien d\'émargement n\'est pas valide.'}
            </p>
            {tokenValid?.expires_at && (
              <p className="text-sm text-muted-foreground">
                Date d'expiration : {format(new Date(tokenValid.expires_at), 'PPP à HH:mm', { locale: fr })}
              </p>
            )}
            <Button onClick={() => navigate('/dashboard')} className="mt-4 w-full" variant="outline">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Utilisateur non inscrit à cette formation
  if (!isEnrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              Accès non autorisé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Vous n'êtes pas inscrit à cette formation et ne pouvez donc pas signer cette feuille d'émargement.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full" variant="outline">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage du pad de signature
  if (showSignature) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Signez votre présence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Session</p>
              <p className="text-lg">{tokenValid.formation_title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(tokenValid.date), 'PPP', { locale: fr })} • {tokenValid.start_time.substring(0, 5)} - {tokenValid.end_time.substring(0, 5)}
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Participant</p>
              <p className="text-lg">{currentUser.first_name} {currentUser.last_name}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>

            <SignaturePad
              onSave={handleSignature}
              onCancel={() => setShowSignature(false)}
              initialSignature={userSignature || undefined}
            />
            
            {signing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                <span>Enregistrement en cours...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue principale
  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            Émargement en ligne
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de la session */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-lg">{tokenValid.formation_title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(tokenValid.date), 'PPP', { locale: fr })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {tokenValid.start_time.substring(0, 5)} - {tokenValid.end_time.substring(0, 5)}
              </span>
            </div>
            {tokenValid.session_type === 'autonomie' && (
              <div className="mt-2 inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                Session en autonomie
              </div>
            )}
          </div>

          {/* Informations de l'utilisateur */}
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{currentUser.first_name} {currentUser.last_name}</p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Statut et actions */}
          {hasAlreadySigned ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="text-green-600 font-semibold">Présence confirmée</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous avez déjà signé cette feuille d'émargement
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Signature enregistrée disponible */}
              {userSignature && (
                <div className="bg-card border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-24 border rounded bg-white flex items-center justify-center">
                      <img 
                        src={userSignature} 
                        alt="Votre signature" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Votre signature enregistrée</p>
                      <p className="text-sm text-muted-foreground">
                        Utilisez cette signature pour valider rapidement votre présence
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSignWithSavedSignature} 
                    disabled={signing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {signing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Validation en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Valider ma présence avec ma signature
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Option pour signer manuellement */}
              <div className="text-center">
                {userSignature && (
                  <p className="text-sm text-muted-foreground mb-2">ou</p>
                )}
                <Button 
                  variant={userSignature ? "outline" : "default"}
                  onClick={() => setShowSignature(true)}
                  className="w-full"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  {userSignature ? 'Signer manuellement' : 'Signer ma présence'}
                </Button>
              </div>
            </div>
          )}

          {/* Information légale */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            En signant cette feuille d'émargement, vous confirmez votre présence à cette session de formation. 
            Cette signature électronique a valeur légale conformément à la réglementation en vigueur.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignaturePublique;