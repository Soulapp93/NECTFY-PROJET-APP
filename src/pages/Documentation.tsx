import React, { useState, useRef } from 'react';
import { Book, Users, GraduationCap, UserCheck, Briefcase, ChevronRight, Download, FileText, Calendar, MessageSquare, ClipboardCheck, Settings, Building, BookOpen, Clock, CheckCircle, ArrowRight, Play, Shield, Mail, Bell, User, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

// Import screenshots
import tableauDeBordImg from '@/assets/screenshots/tableau-de-bord.png';
import administrationImg from '@/assets/screenshots/administration.png';
import gestionFormationsImg from '@/assets/screenshots/gestion-formations-1.png';
import gestionFormations2Img from '@/assets/screenshots/gestion-formations-2.png';
import gestionUtilisateursImg from '@/assets/screenshots/gestion-utilisateurs.png';
import emargement1Img from '@/assets/screenshots/emargement-1.png';
import emargement2Img from '@/assets/screenshots/emargement-2.png';
import emploisTempsImg from '@/assets/screenshots/emplois-temps.png';
import emploisTempsCalendrierImg from '@/assets/screenshots/emplois-temps-calendrier.png';
import messagerieImg from '@/assets/screenshots/messagerie-1.png';
import messagerie2Img from '@/assets/screenshots/messagerie-2.png';
import groupesImg from '@/assets/screenshots/groupes.png';
import profilImg from '@/assets/screenshots/profil.png';
import cahiersTextesImg from '@/assets/screenshots/cahiers-textes.png';
import cahierTexteDetailImg from '@/assets/screenshots/cahier-texte-detail.png';
import gestionEtablissementImg from '@/assets/screenshots/gestion-etablissement.png';
import espaceTuteursImg from '@/assets/screenshots/espace-tuteurs.png';
import classesVirtuellesImg from '@/assets/screenshots/classes-virtuelles.png';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const Documentation = () => {
  const [activeRole, setActiveRole] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast.info('Génération du PDF en cours... Cela peut prendre quelques secondes.');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const content = contentRef.current;
      if (!content) {
        throw new Error('Contenu non trouvé');
      }

      // Créer un PDF A4
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      // Page de titre
      pdf.setFontSize(28);
      pdf.setTextColor(139, 92, 246);
      pdf.text('NECTFORMA', pageWidth / 2, 60, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Guide d'utilisation complet", pageWidth / 2, 75, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 90, { align: 'center' });

      // Capture du contenu avec options optimisées
      const canvas = await html2canvas(content, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 15000,
        removeContainer: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Calculer le nombre de pages nécessaires
      const pageContentHeight = pageHeight - (margin * 2);
      let yPosition = 0;
      
      // Ajouter nouvelle page pour le contenu
      pdf.addPage();
      
      // Boucle pour gérer la pagination correctement
      while (yPosition < imgHeight) {
        if (yPosition > 0) {
          pdf.addPage();
        }
        
        // Calculer la position Y dans l'image source
        const sourceY = (yPosition / imgHeight) * canvas.height;
        
        // Ajouter l'image avec un offset négatif pour "scroller" vers le bas
        pdf.addImage(
          imgData,
          'JPEG',
          margin,
          margin - yPosition,
          imgWidth,
          imgHeight
        );
        
        yPosition += pageContentHeight;
      }

      pdf.save('NECTFORMA-Guide-Utilisation.pdf');
      toast.success('PDF généré avec succès !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  const roleFilters = [
    { id: 'all', label: 'Tous', icon: <Users className="h-4 w-4" /> },
    { id: 'admin', label: 'Administrateurs', icon: <Shield className="h-4 w-4" /> },
    { id: 'formateur', label: 'Formateurs', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'etudiant', label: 'Étudiants', icon: <UserCheck className="h-4 w-4" /> },
    { id: 'tuteur', label: 'Tuteurs', icon: <Briefcase className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Guide d'utilisation NECTFORMA
                </h1>
                <p className="text-sm text-muted-foreground">Documentation complète de la plateforme</p>
              </div>
            </div>
            
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Génération...' : 'Télécharger en PDF'}
            </Button>
          </div>

          {/* Role filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {roleFilters.map((role) => (
              <Button
                key={role.id}
                variant={activeRole === role.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveRole(role.id)}
                className="gap-2"
              >
                {role.icon}
                {role.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8" ref={contentRef}>
        {/* Introduction */}
        <section className="mb-12">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Play className="h-6 w-6 text-primary" />
                Bienvenue sur NECTFORMA
              </CardTitle>
              <CardDescription className="text-base">
                NECTFORMA est une plateforme de gestion pédagogique complète destinée aux établissements de formation. 
                Ce guide vous accompagne dans la découverte et l'utilisation de toutes les fonctionnalités.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Building className="h-5 w-5" />} label="Gestion établissement" />
                <StatCard icon={<Users className="h-5 w-5" />} label="Suivi utilisateurs" />
                <StatCard icon={<Calendar className="h-5 w-5" />} label="Emplois du temps" />
                <StatCard icon={<ClipboardCheck className="h-5 w-5" />} label="Émargement digital" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Table des matières */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Table des matières
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <TocItem number="1" title="Création de compte" />
            <TocItem number="2" title="Premier pas - Connexion" />
            <TocItem number="3" title="Tableau de bord" roles={['admin']} />
            <TocItem number="4" title="Gestion des utilisateurs" roles={['admin']} />
            <TocItem number="5" title="Gestion des formations" roles={['admin']} />
            <TocItem number="6" title="Emplois du temps" />
            <TocItem number="7" title="Émargement & Présences" />
            <TocItem number="8" title="Cahier de textes" />
            <TocItem number="9" title="Messagerie interne" />
            <TocItem number="10" title="Groupes de discussion" />
            <TocItem number="11" title="Espace Tuteur" roles={['tuteur']} />
            <TocItem number="12" title="Mon profil & Paramètres" />
          </div>
        </section>

        <Separator className="my-8" />

        {/* Section 1: Création de compte */}
        <DocSectionWrapper
          id="creation-compte"
          number="1"
          title="Création de compte établissement"
          description="Comment créer votre espace établissement sur NECTFORMA"
          roles={['admin']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <ProcessFlow steps={[
              { icon: <LogIn />, title: "Accéder à NECTFORMA", description: "Rendez-vous sur nectforma.lovable.app" },
              { icon: <Building />, title: "Créer un établissement", description: "Cliquez sur 'Créer mon établissement'" },
              { icon: <FileText />, title: "Renseigner les infos", description: "Nom, adresse, SIRET, type d'établissement" },
              { icon: <User />, title: "Compte administrateur", description: "Créez votre compte Admin Principal" },
              { icon: <CheckCircle />, title: "Confirmation", description: "Validez votre email et connectez-vous" },
            ]} />
            
            <div className="grid md:grid-cols-2 gap-6">
              <InfoCard 
                title="Informations établissement requises"
                items={[
                  "Nom de l'établissement",
                  "Type (École, Centre de formation, Entreprise...)",
                  "Adresse complète",
                  "Numéro SIRET (optionnel)",
                  "Email de contact",
                  "Téléphone",
                  "Site web (optionnel)",
                  "Nom du directeur"
                ]}
              />
              <InfoCard 
                title="Informations administrateur"
                items={[
                  "Prénom et nom",
                  "Adresse email professionnelle",
                  "Numéro de téléphone",
                  "Mot de passe sécurisé (8+ caractères)",
                ]}
              />
            </div>

            <TipCard type="info">
              L'Admin Principal a tous les droits sur l'établissement : gestion des utilisateurs, des formations, des paramètres, etc. 
              Il peut ensuite créer d'autres administrateurs avec des droits plus limités.
            </TipCard>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 2: Connexion */}
        <DocSectionWrapper
          id="connexion"
          number="2"
          title="Premier pas - Connexion"
          description="Comment se connecter à votre espace NECTFORMA"
          roles={['all']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Si vous avez reçu une invitation
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><Badge variant="outline">1</Badge> Cliquez sur le lien dans l'email d'invitation</li>
                  <li className="flex gap-2"><Badge variant="outline">2</Badge> Créez votre mot de passe</li>
                  <li className="flex gap-2"><Badge variant="outline">3</Badge> Validez votre compte</li>
                  <li className="flex gap-2"><Badge variant="outline">4</Badge> Connectez-vous avec vos identifiants</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-primary" />
                  Connexion quotidienne
                </h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2"><Badge variant="outline">1</Badge> Accédez à nectforma.lovable.app</li>
                  <li className="flex gap-2"><Badge variant="outline">2</Badge> Cliquez sur "Se connecter"</li>
                  <li className="flex gap-2"><Badge variant="outline">3</Badge> Entrez votre email et mot de passe</li>
                  <li className="flex gap-2"><Badge variant="outline">4</Badge> Vous êtes redirigé vers votre espace</li>
                </ol>
              </div>
            </div>

            <TipCard type="warning">
              Mot de passe oublié ? Cliquez sur "Mot de passe oublié" sur la page de connexion. 
              Un email vous sera envoyé avec un lien de réinitialisation.
            </TipCard>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 3: Tableau de bord */}
        <DocSectionWrapper
          id="tableau-bord"
          number="3"
          title="Tableau de bord"
          description="Vue d'ensemble de votre activité"
          roles={['admin']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <ScreenshotCard 
              src={tableauDeBordImg} 
              alt="Tableau de bord NECTFORMA"
              caption="Vue d'ensemble du tableau de bord administrateur"
            />
            
            <div className="grid md:grid-cols-3 gap-4">
              <FeatureCard 
                icon={<Users className="h-5 w-5" />}
                title="Statistiques utilisateurs"
                description="Nombre d'étudiants, formateurs, tuteurs actifs"
              />
              <FeatureCard 
                icon={<Calendar className="h-5 w-5" />}
                title="Sessions du jour"
                description="Vue rapide des cours et sessions planifiés"
              />
              <FeatureCard 
                icon={<ClipboardCheck className="h-5 w-5" />}
                title="Émargement en attente"
                description="Sessions nécessitant validation"
              />
            </div>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 4: Gestion des utilisateurs */}
        <DocSectionWrapper
          id="gestion-utilisateurs"
          number="4"
          title="Gestion des utilisateurs"
          description="Ajouter, modifier et gérer les comptes utilisateurs"
          roles={['admin']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <ScreenshotCard 
              src={gestionUtilisateursImg} 
              alt="Gestion des utilisateurs"
              caption="Interface de gestion des utilisateurs"
            />
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="ajouter">
                <AccordionTrigger className="font-semibold">
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Ajouter un utilisateur
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ProcessFlow steps={[
                    { icon: <Users />, title: "Administration", description: "Accédez à la section Administration" },
                    { icon: <UserPlus />, title: "Inviter", description: "Cliquez sur 'Inviter un utilisateur'" },
                    { icon: <FileText />, title: "Formulaire", description: "Remplissez prénom, nom, email, rôle" },
                    { icon: <Mail />, title: "Invitation", description: "L'utilisateur reçoit un email d'invitation" },
                  ]} />
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="roles">
                <AccordionTrigger className="font-semibold">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Rôles disponibles
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-3">
                    <RoleCard 
                      role="Admin Principal" 
                      description="Contrôle total de l'établissement, gestion du compte" 
                      color="destructive"
                    />
                    <RoleCard 
                      role="Admin" 
                      description="Gestion des utilisateurs et formations (pas d'accès aux paramètres établissement)" 
                      color="secondary"
                    />
                    <RoleCard 
                      role="Formateur" 
                      description="Gestion des cours, émargement, cahier de textes" 
                      color="default"
                    />
                    <RoleCard 
                      role="Étudiant" 
                      description="Accès aux formations assignées, emploi du temps, devoirs" 
                      color="outline"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="import">
                <AccordionTrigger className="font-semibold">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Import en masse (Excel)
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Importez plusieurs utilisateurs d'un coup via un fichier Excel (.xlsx).
                    </p>
                    <InfoCard 
                      title="Colonnes requises dans votre fichier"
                      items={[
                        "Prénom (first_name)",
                        "Nom (last_name)", 
                        "Email (email)",
                        "Rôle (role) : Étudiant, Formateur, Admin",
                        "Téléphone (phone) - optionnel",
                      ]}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 5: Gestion des formations */}
        <DocSectionWrapper
          id="gestion-formations"
          number="5"
          title="Gestion des formations"
          description="Créer et organiser vos formations"
          roles={['admin']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ScreenshotCard 
                src={gestionFormationsImg} 
                alt="Liste des formations"
                caption="Vue liste des formations"
              />
              <ScreenshotCard 
                src={gestionFormations2Img} 
                alt="Détail formation"
                caption="Création/édition d'une formation"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <InfoCard 
                title="Créer une formation"
                items={[
                  "Titre de la formation",
                  "Description détaillée",
                  "Niveau (Débutant, Intermédiaire, Avancé)",
                  "Durée en heures",
                  "Dates de début et fin",
                  "Nombre max d'étudiants",
                  "Couleur d'identification",
                ]}
              />
              <InfoCard 
                title="Structure d'une formation"
                items={[
                  "Modules pédagogiques",
                  "Contenus (documents, vidéos, liens)",
                  "Devoirs et exercices",
                  "Emploi du temps dédié",
                  "Cahier de textes",
                  "Participants assignés",
                ]}
              />
            </div>

            <TipCard type="success">
              Assignez une couleur unique à chaque formation pour les identifier facilement dans les emplois du temps et tableaux de bord.
            </TipCard>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 6: Emplois du temps */}
        <DocSectionWrapper
          id="emploi-temps"
          number="6"
          title="Emplois du temps"
          description="Planifier et consulter les sessions de formation"
          roles={['all']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ScreenshotCard 
                src={emploisTempsImg} 
                alt="Emploi du temps liste"
                caption="Vue liste des créneaux"
              />
              <ScreenshotCard 
                src={emploisTempsCalendrierImg} 
                alt="Emploi du temps calendrier"
                caption="Vue calendrier"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <FeatureCard 
                icon={<Calendar className="h-5 w-5" />}
                title="Vues multiples"
                description="Jour, semaine, mois, liste"
              />
              <FeatureCard 
                icon={<FileText className="h-5 w-5" />}
                title="Export PDF"
                description="Imprimez vos emplois du temps"
              />
              <FeatureCard 
                icon={<Clock className="h-5 w-5" />}
                title="Sessions"
                description="Encadrées ou autonomie"
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="creer">
                <AccordionTrigger className="font-semibold">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Créer un créneau (Admin)
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ProcessFlow steps={[
                    { icon: <Calendar />, title: "Sélectionner", description: "Choisissez la date et l'heure" },
                    { icon: <BookOpen />, title: "Module", description: "Sélectionnez le module concerné" },
                    { icon: <User />, title: "Formateur", description: "Assignez un formateur" },
                    { icon: <Building />, title: "Salle", description: "Indiquez la salle (optionnel)" },
                    { icon: <CheckCircle />, title: "Valider", description: "Enregistrez le créneau" },
                  ]} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 7: Émargement */}
        <DocSectionWrapper
          id="emargement"
          number="7"
          title="Émargement & Présences"
          description="Gérer les signatures et le suivi des présences"
          roles={['admin', 'formateur', 'etudiant']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ScreenshotCard 
                src={emargement1Img} 
                alt="Émargement liste"
                caption="Liste des feuilles d'émargement"
              />
              <ScreenshotCard 
                src={emargement2Img} 
                alt="Émargement signature"
                caption="Interface de signature"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Session Encadrée
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> Le formateur génère un QR code</li>
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> Les étudiants scannent pour signer</li>
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> Le formateur signe en fin de session</li>
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> L'admin valide la feuille</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Session Autonomie
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> L'admin envoie un lien de signature</li>
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> L'étudiant reçoit par email/messagerie</li>
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> Il signe depuis le lien (validité 24h)</li>
                    <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" /> L'admin valide la feuille</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <TipCard type="info">
              Les feuilles d'émargement sont générées automatiquement à partir des créneaux de l'emploi du temps. 
              Vous pouvez les exporter en PDF pour archivage.
            </TipCard>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 8: Cahier de textes */}
        <DocSectionWrapper
          id="cahier-textes"
          number="8"
          title="Cahier de textes"
          description="Suivi pédagogique des cours"
          roles={['admin', 'formateur', 'etudiant', 'tuteur']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ScreenshotCard 
                src={cahiersTextesImg} 
                alt="Cahiers de textes"
                caption="Liste des cahiers de textes"
              />
              <ScreenshotCard 
                src={cahierTexteDetailImg} 
                alt="Détail cahier de textes"
                caption="Entrée détaillée d'un cours"
              />
            </div>

            <InfoCard 
              title="Contenu d'une entrée"
              items={[
                "Date et horaires du cours",
                "Matière / Module concerné",
                "Contenu abordé pendant la séance",
                "Objectifs pédagogiques",
                "Devoirs à faire pour la prochaine fois",
                "Documents joints (supports de cours)",
              ]}
            />

            <TipCard type="success">
              Les tuteurs peuvent consulter le cahier de textes de leurs apprentis pour suivre leur progression pédagogique.
            </TipCard>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 9: Messagerie */}
        <DocSectionWrapper
          id="messagerie"
          number="9"
          title="Messagerie interne"
          description="Communiquer avec les membres de l'établissement"
          roles={['admin', 'formateur', 'etudiant']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ScreenshotCard 
                src={messagerieImg} 
                alt="Messagerie"
                caption="Interface de messagerie"
              />
              <ScreenshotCard 
                src={messagerie2Img} 
                alt="Nouveau message"
                caption="Rédaction d'un message"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <FeatureCard 
                icon={<Mail className="h-5 w-5" />}
                title="Messages personnels"
                description="Échangez en privé"
              />
              <FeatureCard 
                icon={<FileText className="h-5 w-5" />}
                title="Pièces jointes"
                description="Partagez des documents"
              />
              <FeatureCard 
                icon={<Clock className="h-5 w-5" />}
                title="Programmation"
                description="Planifiez vos envois"
              />
            </div>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 10: Groupes */}
        <DocSectionWrapper
          id="groupes"
          number="10"
          title="Groupes de discussion"
          description="Discussions instantanées en groupe"
          roles={['admin', 'formateur', 'etudiant']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <ScreenshotCard 
              src={groupesImg} 
              alt="Groupes de discussion"
              caption="Interface des groupes de discussion"
            />

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Groupe Établissement</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Groupe automatiquement créé, réunissant tous les membres de l'établissement. 
                  Idéal pour les annonces générales.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Groupes personnalisés</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Créez des groupes thématiques (par formation, par projet, par promotion...) 
                  et invitez les membres de votre choix.
                </CardContent>
              </Card>
            </div>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 11: Espace Tuteur */}
        <DocSectionWrapper
          id="espace-tuteur"
          number="11"
          title="Espace Tuteur"
          description="Suivi des apprentis en entreprise"
          roles={['tuteur', 'admin']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <ScreenshotCard 
              src={espaceTuteursImg} 
              alt="Espace tuteurs"
              caption="Tableau de bord tuteur"
            />

            <div className="grid md:grid-cols-2 gap-6">
              <InfoCard 
                title="Ce que le tuteur peut voir"
                items={[
                  "Formations de son apprenti",
                  "Emploi du temps",
                  "Cahier de textes",
                  "Feuilles d'émargement",
                  "Historique des présences/absences",
                ]}
              />
              <InfoCard 
                title="Inviter un tuteur"
                items={[
                  "Lors de la création d'un étudiant",
                  "Renseignez l'email du tuteur",
                  "Indiquez l'entreprise et la fonction",
                  "Le tuteur reçoit une invitation",
                  "Il crée son compte et accède à l'espace",
                ]}
              />
            </div>

            <TipCard type="info">
              Les tuteurs n'ont pas accès à la messagerie ni aux groupes de discussion. 
              Leur accès est limité au suivi pédagogique de leur(s) apprenti(s).
            </TipCard>
          </div>
        </DocSectionWrapper>

        <Separator className="my-8" />

        {/* Section 12: Profil */}
        <DocSectionWrapper
          id="profil"
          number="12"
          title="Mon profil & Paramètres"
          description="Gérer vos informations personnelles"
          roles={['all']}
          activeRole={activeRole}
        >
          <div className="space-y-6">
            <ScreenshotCard 
              src={profilImg} 
              alt="Page de profil"
              caption="Gestion du profil utilisateur"
            />

            <div className="grid md:grid-cols-3 gap-4">
              <FeatureCard 
                icon={<User className="h-5 w-5" />}
                title="Photo de profil"
                description="Personnalisez votre avatar"
              />
              <FeatureCard 
                icon={<Settings className="h-5 w-5" />}
                title="Informations"
                description="Modifiez vos coordonnées"
              />
              <FeatureCard 
                icon={<Bell className="h-5 w-5" />}
                title="Notifications"
                description="Gérez vos préférences"
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="signature">
                <AccordionTrigger className="font-semibold">
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    Ma signature numérique
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Enregistrez une signature numérique pour émarger rapidement en un clic.
                    </p>
                    <ol className="space-y-2">
                      <li className="flex gap-2"><Badge variant="outline">1</Badge> Allez dans "Mon compte"</li>
                      <li className="flex gap-2"><Badge variant="outline">2</Badge> Section "Ma signature"</li>
                      <li className="flex gap-2"><Badge variant="outline">3</Badge> Dessinez votre signature</li>
                      <li className="flex gap-2"><Badge variant="outline">4</Badge> Enregistrez</li>
                    </ol>
                    <p className="text-green-600">
                      ✓ Lors de l'émargement, un simple clic suffira pour signer avec votre signature enregistrée.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </DocSectionWrapper>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <Separator className="my-8" />
          <p>
            © {new Date().getFullYear()} NECTFORMA - Plateforme de gestion pédagogique
          </p>
          <p className="mt-2">
            Besoin d'aide ? Contactez le support de votre établissement.
          </p>
        </div>
      </div>
    </div>
  );
};

// Composants utilitaires

const StatCard = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border">
    <div className="text-primary">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const TocItem = ({ number, title, roles }: { number: string; title: string; roles?: string[] }) => (
  <div className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
    <Badge variant="outline" className="flex-shrink-0">{number}</Badge>
    <span className="text-sm font-medium">{title}</span>
    {roles && (
      <div className="ml-auto flex gap-1">
        {roles.includes('admin') && <Badge variant="destructive" className="text-[10px] px-1">Admin</Badge>}
        {roles.includes('tuteur') && <Badge variant="secondary" className="text-[10px] px-1">Tuteur</Badge>}
      </div>
    )}
  </div>
);

interface DocSectionWrapperProps {
  id: string;
  number: string;
  title: string;
  description: string;
  roles: string[];
  activeRole: string;
  children: React.ReactNode;
}

const DocSectionWrapper = ({ id, number, title, description, roles, activeRole, children }: DocSectionWrapperProps) => {
  const isVisible = activeRole === 'all' || roles.includes('all') || roles.includes(activeRole);
  
  if (!isVisible) return null;

  return (
    <section id={id} className="scroll-mt-32">
      <div className="flex items-start gap-4 mb-6">
        <Badge variant="outline" className="text-lg px-3 py-1 flex-shrink-0">{number}</Badge>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
};

const ProcessFlow = ({ steps }: { steps: { icon: React.ReactNode; title: string; description: string }[] }) => (
  <div className="flex flex-wrap items-center justify-center gap-2 p-4 bg-muted/30 rounded-xl">
    {steps.map((step, index) => (
      <React.Fragment key={index}>
        <div className="flex flex-col items-center text-center p-3 min-w-[100px]">
          <div className="p-2 rounded-full bg-primary/10 text-primary mb-2">
            {step.icon}
          </div>
          <span className="text-xs font-semibold">{step.title}</span>
          <span className="text-[10px] text-muted-foreground mt-1">{step.description}</span>
        </div>
        {index < steps.length - 1 && (
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden md:block" />
        )}
      </React.Fragment>
    ))}
  </div>
);

const InfoCard = ({ title, items }: { title: string; items: string[] }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const TipCard = ({ type, children }: { type: 'info' | 'warning' | 'success'; children: React.ReactNode }) => {
  const colors = {
    info: 'border-primary/30 bg-primary/5 text-foreground',
    warning: 'border-accent/30 bg-accent/5 text-foreground',
    success: 'border-green-500/30 bg-green-500/5 text-foreground',
  };
  
  return (
    <div className={`p-4 rounded-lg border ${colors[type]}`}>
      <p className="text-sm">{children}</p>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <Card className="text-center">
    <CardContent className="pt-6">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h4 className="font-semibold text-sm">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

const ScreenshotCard = ({ src, alt, caption }: { src: string; alt: string; caption: string }) => (
  <div className="space-y-2">
    <div className="rounded-xl overflow-hidden border shadow-lg">
      <img src={src} alt={alt} className="w-full h-auto" loading="lazy" />
    </div>
    <p className="text-xs text-center text-muted-foreground">{caption}</p>
  </div>
);

const RoleCard = ({ role, description, color }: { role: string; description: string; color: 'default' | 'secondary' | 'destructive' | 'outline' }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
    <Badge variant={color}>{role}</Badge>
    <span className="text-sm text-muted-foreground">{description}</span>
  </div>
);

export default Documentation;
