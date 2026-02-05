 import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, 
  ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles, Play, Shield, Zap, Clock, Monitor,
  Send, Phone, MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FloatingCTA from '@/components/landing/FloatingCTA';
import ChatWidget from '@/components/landing/ChatWidget';
import FAQSection from '@/components/landing/FAQSection';
import AnimatedSection from '@/components/landing/AnimatedSection';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import TextReveal from '@/components/landing/TextReveal';
import ParallaxSection from '@/components/landing/ParallaxSection';
import GlowCard from '@/components/landing/GlowCard';
import Hover3DCard from '@/components/landing/Hover3DCard';
import AnimatedButton from '@/components/landing/AnimatedButton';
import SectionDivider from '@/components/landing/SectionDivider';
import GradientBackground from '@/components/landing/GradientBackground';
 import MobileDrawerNavigation from '@/components/landing/MobileDrawerNavigation';
 import { Menu } from 'lucide-react';

// Import du logo NF stylé
import nfLogo from '@/assets/logo-nf-styled.png';

// Imports des captures d'écran
import tableauDeBordImg from '@/assets/screenshots/tableau-de-bord.png';
import administrationImg from '@/assets/screenshots/administration.png';
import gestionUtilisateursImg from '@/assets/screenshots/gestion-utilisateurs.png';
import gestionFormations1Img from '@/assets/screenshots/gestion-formations-1.png';
import gestionFormations2Img from '@/assets/screenshots/gestion-formations-2.png';
import cahiersTextesImg from '@/assets/screenshots/cahiers-textes.png';
import cahierTexteDetailImg from '@/assets/screenshots/cahier-texte-detail.png';
import emploisTempsImg from '@/assets/screenshots/emplois-temps.png';
import emploisTempsCalendrierImg from '@/assets/screenshots/emplois-temps-calendrier.png';
import emargement1Img from '@/assets/screenshots/emargement-1.png';
import emargement2Img from '@/assets/screenshots/emargement-2.png';
import messagerie1Img from '@/assets/screenshots/messagerie-1.png';
import messagerie2Img from '@/assets/screenshots/messagerie-2.png';
import groupesImg from '@/assets/screenshots/groupes.png';
import gestionEtablissementImg from '@/assets/screenshots/gestion-etablissement.png';
import profilImg from '@/assets/screenshots/profil.png';
import espaceTuteursImg from '@/assets/screenshots/espace-tuteurs.png';
import classesVirtuellesImg from '@/assets/screenshots/classes-virtuelles.png';

interface FeatureItem {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  details: string[];
  imagePlaceholder: string;
  images: string[];
}

const Index = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const features: FeatureItem[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Tableau de bord',
      subtitle: 'Vue d\'ensemble en temps réel',
      description: 'Accédez à une vue synthétique de votre établissement avec des indicateurs clés : taux de présence, sessions à venir, cahiers de texte à compléter, et statistiques globales.',
      benefits: ['Statistiques de présence en temps réel', 'Alertes sur les cahiers de texte manquants', 'Vue des prochaines sessions'],
      details: [
        'Taux de présence global et par formation',
        'Nombre de sessions planifiées cette semaine',
        'Rappels automatiques pour les entrées manquantes',
        'Filtres par formation et par période'
      ],
      imagePlaceholder: 'dashboard',
      images: [tableauDeBordImg]
    },
    {
      id: 'administration',
      icon: ShieldCheck,
      title: 'Administration',
      subtitle: 'Gestion centralisée complète',
      description: 'Centre de contrôle unifié pour gérer les utilisateurs, formations, cahiers de texte, emplois du temps et feuilles d\'émargement depuis une interface intuitive avec des onglets dédiés.',
      benefits: ['Interface unifiée avec onglets', 'Accès rapide à toutes les fonctions', 'Gestion complète des données'],
      details: [
        'Onglet Utilisateurs : création, import Excel, gestion des rôles',
        'Onglet Formations : modules, participants, instructeurs',
        'Onglet Cahiers de texte : suivi par formation',
        'Onglet Emplois du temps : planning visuel',
        'Onglet Émargements : génération et suivi'
      ],
      imagePlaceholder: 'administration',
      images: [administrationImg]
    },
    {
      id: 'users',
      icon: Users,
      title: 'Gestion des utilisateurs',
      subtitle: 'Apprenants, formateurs, administrateurs',
      description: 'Gérez l\'ensemble des profils de votre établissement. Créez des comptes individuellement ou par import Excel, attribuez les rôles (AdminPrincipal, Admin, Formateur, Étudiant) et suivez leur activité.',
      benefits: ['Import/Export Excel des utilisateurs', 'Attribution des rôles granulaire', 'Invitations par email automatiques'],
      details: [
        'Création rapide avec formulaire complet',
        'Import massif via fichier Excel',
        'Rôles : AdminPrincipal, Admin, Formateur, Étudiant',
        'Envoi automatique d\'invitations par email',
        'Activation/désactivation des comptes',
        'Photo de profil et signature enregistrée'
      ],
      imagePlaceholder: 'users',
      images: [gestionUtilisateursImg]
    },
    {
      id: 'formations',
      icon: GraduationCap,
      title: 'Gestion des formations',
      subtitle: 'Programmes modulaires complets',
      description: 'Créez des formations structurées avec modules personnalisés. Définissez les dates, durées, niveaux et assignez des formateurs et apprenants. Chaque formation dispose de son propre espace.',
      benefits: ['Structure modulaire flexible', 'Assignation formateurs/apprenants', 'Espace dédié par formation'],
      details: [
        'Création de formations avec titre, dates, durée',
        'Niveaux : Débutant, Intermédiaire, Avancé',
        'Modules avec contenus pédagogiques',
        'Devoirs et travaux avec soumissions',
        'Documents partagés par module',
        'Corrections et notations intégrées'
      ],
      imagePlaceholder: 'formations',
      images: [gestionFormations1Img, gestionFormations2Img]
    },
    {
      id: 'textbooks',
      icon: BookText,
      title: 'Cahiers de texte',
      subtitle: 'Suivi pédagogique détaillé',
      description: 'Tenez à jour les cahiers de texte de vos formations. Chaque entrée documente : date, horaires, matière abordée, contenu du cours et travail à faire. Pièces jointes supportées.',
      benefits: ['Entrées liées aux créneaux EDT', 'Historique complet des cours', 'Pièces jointes (PDF, images, etc.)'],
      details: [
        'Création automatique depuis l\'emploi du temps',
        'Champs : matière, contenu, travail à faire',
        'Upload de documents de cours',
        'Vue chronologique par formation',
        'Export PDF des cahiers de texte',
        'Alertes pour entrées manquantes'
      ],
      imagePlaceholder: 'textbooks',
      images: [cahiersTextesImg, cahierTexteDetailImg]
    },
    {
      id: 'schedule',
      icon: CalendarDays,
      title: 'Emplois du temps',
      subtitle: 'Planning intelligent et flexible',
      description: 'Planifiez les séances de formation avec un calendrier visuel. Définissez les modules, formateurs, salles et horaires. Génération automatique des feuilles d\'émargement.',
      benefits: ['Vue calendrier interactive', 'Gestion des salles et formateurs', 'Import Excel des plannings'],
      details: [
        'Vues : jour, semaine, mois, liste',
        'Création de créneaux avec module, formateur, salle',
        'Code couleur par formation ou module',
        'Import massif via fichier Excel',
        'Notifications des changements',
        'Lien automatique avec émargements'
      ],
      imagePlaceholder: 'schedule',
      images: [emploisTempsImg, emploisTempsCalendrierImg]
    },
    {
      id: 'attendance',
      icon: ClipboardCheck,
      title: 'Gestion des émargements',
      subtitle: 'Signatures numériques conformes',
      description: 'Système d\'émargement digital complet : génération automatique des feuilles depuis l\'EDT, signatures électroniques, QR codes dynamiques, et suivi des présences en temps réel.',
      benefits: ['QR Code dynamique sécurisé', 'Signature électronique tactile', 'Conformité réglementaire'],
      details: [
        'Génération auto depuis les créneaux EDT',
        'QR Code unique par session',
        'Signature sur écran tactile ou mobile',
        'Motifs d\'absence configurables',
        'Validation administrative des feuilles',
        'Export PDF des feuilles signées',
        'Envoi de liens de signature par email'
      ],
      imagePlaceholder: 'attendance',
      images: [emargement1Img, emargement2Img]
    },
    {
      id: 'messaging',
      icon: Mail,
      title: 'Messagerie interne',
      subtitle: 'Communication professionnelle',
      description: 'Messagerie intégrée type email pour communiquer avec tous les utilisateurs de votre établissement. Envoyez des messages individuels ou groupés avec pièces jointes.',
      benefits: ['Messages avec pièces jointes', 'Envoi individuel ou groupé', 'Boîte de réception organisée'],
      details: [
        'Composition de messages riches',
        'Sélection multiple de destinataires',
        'Pièces jointes (documents, images)',
        'Dossiers : reçus, envoyés, favoris, archives',
        'Recherche dans les messages',
        'Transfert et réponse rapide'
      ],
      imagePlaceholder: 'messaging',
      images: [messagerie1Img, messagerie2Img]
    },
    {
      id: 'groups',
      icon: UsersRound,
      title: 'Groupes établissement',
      subtitle: 'Discussions collaboratives',
      description: 'Créez des groupes de discussion pour vos formations, équipes ou projets. Chat en temps réel, partage de fichiers et collaboration instantanée entre membres.',
      benefits: ['Groupes par formation automatiques', 'Chat temps réel', 'Partage de fichiers'],
      details: [
        'Groupes automatiques par formation',
        'Groupes personnalisés (équipes, projets)',
        'Messages en temps réel',
        'Partage de documents',
        'Historique des conversations',
        'Notifications de nouveaux messages'
      ],
      imagePlaceholder: 'groups',
      images: [groupesImg]
    },
    {
      id: 'establishment',
      icon: Building2,
      title: 'Gestion du compte établissement',
      subtitle: 'Configuration et paramètres',
      description: 'Configurez les informations de votre établissement : nom, logo, coordonnées, SIRET. Personnalisez l\'apparence et gérez les paramètres globaux de la plateforme.',
      benefits: ['Logo et identité visuelle', 'Informations légales complètes', 'Personnalisation de l\'interface'],
      details: [
        'Nom et type d\'établissement',
        'Logo personnalisé',
        'Adresse et coordonnées',
        'Numéro SIRET',
        'Directeur et contacts',
        'Paramètres de notifications'
      ],
      imagePlaceholder: 'establishment',
      images: [gestionEtablissementImg]
    },
    {
      id: 'profiles',
      icon: UserCircle,
      title: 'Gestion des profils',
      subtitle: 'Compte utilisateur personnel',
      description: 'Chaque utilisateur dispose d\'un espace profil pour gérer ses informations personnelles, sa photo, sa signature enregistrée et ses préférences de notifications.',
      benefits: ['Photo de profil', 'Signature électronique enregistrée', 'Préférences personnelles'],
      details: [
        'Photo de profil personnalisée',
        'Informations de contact',
        'Signature tactile enregistrée',
        'Préférences de notifications',
        'Changement de mot de passe',
        'Historique des connexions'
      ],
      imagePlaceholder: 'profiles',
      images: [profilImg]
    },
    {
      id: 'tutors',
      icon: Briefcase,
      title: 'Espace tuteurs entreprises',
      subtitle: 'Suivi des alternants',
      description: 'Espace dédié aux tuteurs entreprises pour le suivi de leurs alternants. Visualisation des plannings, consultation des présences et communication avec l\'établissement.',
      benefits: ['Vue planning de l\'alternant', 'Suivi des présences', 'Communication directe'],
      details: [
        'Accès au planning de l\'alternant',
        'Consultation des feuilles d\'émargement',
        'Vue des formations en cours',
        'Contact avec l\'établissement',
        'Informations du contrat d\'alternance',
        'Notifications des absences'
      ],
      imagePlaceholder: 'tutors',
      images: [espaceTuteursImg]
    },
    {
      id: 'virtual-classes',
      icon: Monitor,
      title: 'Classes virtuelles',
      subtitle: 'À venir',
      description: 'Organisez des sessions de formation en ligne avec visioconférence intégrée. Partagez votre écran, interagissez en temps réel avec vos apprenants et enregistrez vos sessions pour les rendre accessibles ultérieurement.',
      benefits: ['Visioconférence intégrée', 'Partage d\'écran', 'Enregistrement des sessions'],
      details: [
        'Création de classes virtuelles planifiées',
        'Visioconférence HD avec audio/vidéo',
        'Partage d\'écran et présentation',
        'Chat en direct pendant les sessions',
        'Enregistrement automatique',
        'Supports pédagogiques partagés',
        'Gestion des participants'
      ],
      imagePlaceholder: 'virtual-classes',
      images: [classesVirtuellesImg]
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header - Sticky avec fond violet */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary to-accent shadow-lg shadow-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
               {/* Hamburger menu button - mobile only */}
               <button
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors mr-1"
                 aria-label="Menu"
               >
                 <Menu className="h-5 w-5 text-white" />
               </button>
               
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                <span className="text-white font-bold text-xs md:text-sm">NF</span>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                  NECTFORMA
                </h1>
              </div>
            </div>
            
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#fonctionnalites" className="text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105">
                Solutions
              </a>
              <Link to="/fonctionnalites" className="text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105">
                Fonctionnalités
              </Link>
              <Link to="/pourquoi-nous" className="text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105">
                Pourquoi nous ?
              </Link>
              <Link to="/blog" className="text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105">
                Articles & Blog
              </Link>
              <a 
                href="#contact" 
                className="text-white/80 hover:text-white font-medium transition-all duration-300 hover:scale-105"
              >
                Contact
              </a>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-4">
              <Link 
                to="/auth" 
                className="px-2 py-1.5 md:px-4 md:py-2 text-white/90 hover:text-white font-medium transition-all duration-300 text-sm md:text-base whitespace-nowrap hover:scale-105"
              >
                Se connecter
              </Link>
              <Link 
                to="/create-establishment" 
                className="hidden sm:inline-flex px-3 md:px-6 py-1.5 md:py-2 bg-white text-primary rounded-full hover:bg-white/90 hover:shadow-xl transform hover:scale-105 font-semibold transition-all duration-300 text-xs md:text-base whitespace-nowrap shadow-lg"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Spacer pour compenser le header fixed */}
      <div className="h-14 md:h-16" />

      {/* Hero Section */}
      <GradientBackground variant="orbs" className="py-16 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto text-center px-2">
          <AnimatedSection animation="scale" delay={0}>
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6 md:mb-8 glass">
              <Sparkles className="h-4 w-4 text-primary mr-2 flex-shrink-0 animate-pulse" />
              <span className="text-primary font-medium text-sm md:text-base">La plateforme tout-en-un pour la formation</span>
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 md:mb-8 leading-tight text-center">
              <span className="block">Gérez vos formations</span>
              <span className="gradient-text-animated block">
                comme jamais
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={300}>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed px-2">
              NECTFORMA est la solution complète pour digitaliser et automatiser 
              la gestion de vos formations. <span className="text-foreground font-medium">12 modules puissants</span> pour tout gérer.
            </p>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={400} className="flex flex-col sm:flex-row gap-4 justify-center mb-12 md:mb-16 px-2">
            <AnimatedButton 
              to="/create-establishment"
              variant="primary"
              size="lg"
              icon={<ArrowRight className="h-5 w-5" />}
            >
              Commencer gratuitement
            </AnimatedButton>
            <AnimatedButton
              href="#fonctionnalites"
              variant="outline"
              size="lg"
              icon={<Play className="h-5 w-5" />}
            >
              Découvrir les solutions
            </AnimatedButton>
          </AnimatedSection>

          {/* Logo Presentation Section - Light Violet Theme */}
          <AnimatedSection animation="scale" delay={500} className="mt-12 md:mt-16 mb-8 md:mb-12 px-2">
            <div className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden aspect-video flex items-center justify-center border border-primary/20"
                 style={{ 
                   background: 'radial-gradient(ellipse at center, hsl(262 83% 95%) 0%, hsl(262 60% 88%) 40%, hsl(270 50% 82%) 100%)',
                   boxShadow: '0 0 60px rgba(139, 92, 246, 0.2), 0 0 100px rgba(168, 85, 247, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.5)'
                 }}>
              
              {/* Étoiles subtiles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 3 + 1 + 'px',
                      height: Math.random() * 3 + 1 + 'px',
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                      backgroundColor: 'rgba(139, 92, 246, 0.4)',
                      opacity: Math.random() * 0.6 + 0.2,
                      animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite ${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>

              {/* Anneaux orbitaux 3D - Plus légers */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1000px' }}>
                <div 
                  className="absolute w-[280px] h-[280px] md:w-[480px] md:h-[480px] rounded-full border-2 opacity-20"
                  style={{ 
                    borderColor: 'hsl(262 83% 58%)',
                    transform: 'rotateX(75deg)',
                    animation: 'orbit-spin 20s linear infinite'
                  }}
                />
                <div 
                  className="absolute w-[220px] h-[220px] md:w-[380px] md:h-[380px] rounded-full border opacity-30"
                  style={{ 
                    borderColor: 'hsl(280 75% 60%)',
                    transform: 'rotateX(75deg) rotateZ(60deg)',
                    animation: 'orbit-spin 15s linear infinite reverse'
                  }}
                />
                <div 
                  className="absolute w-[160px] h-[160px] md:w-[280px] md:h-[280px] rounded-full border opacity-25"
                  style={{ 
                    borderColor: 'hsl(262 83% 50%)',
                    transform: 'rotateX(75deg) rotateZ(-30deg)',
                    animation: 'orbit-spin 25s linear infinite'
                  }}
                />
              </div>

              {/* Halo lumineux derrière le logo */}
              <div 
                className="absolute w-32 h-32 md:w-56 md:h-56 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 70%)',
                  filter: 'blur(25px)',
                  animation: 'pulse-glow 3s ease-in-out infinite'
                }}
              />

              {/* Logo et nom */}
              <div className="relative z-20 flex flex-col items-center justify-center space-y-4 md:space-y-6">
                {/* Logo NF avec effet 3D et bordures arrondies */}
                <div 
                  className="relative"
                  style={{ 
                    animation: 'float-3d 6s ease-in-out infinite',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl"
                       style={{
                         boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3), 0 10px 30px rgba(139, 92, 246, 0.2)'
                       }}>
                    <img 
                      src={nfLogo} 
                      alt="NF Logo" 
                      className="w-20 h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 object-contain"
                      style={{
                        filter: 'drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3))'
                      }}
                    />
                  </div>
                </div>
                
                {/* Nom NECTFORMA */}
                <div className="text-center">
                  <h2 
                    className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, hsl(262 83% 58%) 0%, hsl(280 75% 55%) 50%, hsl(262 83% 50%) 100%)',
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'gradient-shift 4s ease infinite'
                    }}
                  >
                    NECTFORMA
                  </h2>
                  <p 
                    className="mt-3 md:mt-4 text-sm md:text-lg lg:text-xl font-medium tracking-wide"
                    style={{
                      color: 'hsl(262 60% 40%)'
                    }}
                  >
                    La gestion de formation simplifiée
                  </p>
                </div>
              </div>

              {/* Particules flottantes - Plus subtiles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: Math.random() * 8 + 3 + 'px',
                      height: Math.random() * 8 + 3 + 'px',
                      left: Math.random() * 100 + '%',
                      top: Math.random() * 100 + '%',
                      background: `radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)`,
                      animation: `float-particle ${Math.random() * 10 + 10}s ease-in-out infinite ${Math.random() * 5}s`
                    }}
                  />
                ))}
              </div>

              {/* Effet de brillance traversante */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
                  animation: 'shine-sweep 6s ease-in-out infinite'
                }}
              />
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade" delay={600} className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm md:text-base text-muted-foreground">
            <div className="flex items-center group">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center group">
              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                <Shield className="h-4 w-4 text-info" />
              </div>
              <span>Données sécurisées</span>
            </div>
            <div className="flex items-center group">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                <Zap className="h-4 w-4 text-warning" />
              </div>
              <span>Support réactif</span>
            </div>
          </AnimatedSection>
        </div>
      </GradientBackground>

      <SectionDivider variant="wave" fillColor="fill-primary" />

      {/* Features Count Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-primary-foreground">
            <AnimatedSection animation="fade-up" delay={0}>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedCounter end={12} suffix="" />
              </div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Modules complets</div>
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={100}>
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <AnimatedCounter end={100} suffix="%" />
              </div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Dématérialisé</div>
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={200}>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Accessible</div>
            </AnimatedSection>
            <AnimatedSection animation="fade-up" delay={300}>
              <div className="text-4xl md:text-5xl font-bold mb-2">∞</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Utilisateurs</div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <SectionDivider variant="curve" flip fillColor="fill-muted/30" />

      {/* Features Section */}
      <section id="fonctionnalites" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Clock className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Gagnez du temps au quotidien</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Toutes les solutions dont vous avez besoin
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Une plateforme complète avec 12 modules puissants pour gérer efficacement votre établissement de formation
            </p>
          </AnimatedSection>

          <div className="space-y-24 md:space-y-32">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              
              return (
                <AnimatedSection 
                  key={feature.id}
                  animation={isEven ? 'fade-right' : 'fade-left'}
                  delay={100}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}
                >
                  {/* Content */}
                  <div className="flex-1 max-w-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                        <Icon className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">{feature.subtitle}</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground">{feature.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <ul className="space-y-2 mb-6">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-foreground">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-base md:text-lg font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Détails supplémentaires */}
                    <div className="bg-muted/50 rounded-xl p-4 border border-border">
                      <p className="text-sm font-semibold text-foreground mb-3">Fonctionnalités détaillées :</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start text-sm text-muted-foreground">
                            <span className="text-primary mr-2">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="flex-1 w-full max-w-2xl">
                    {feature.images && feature.images.length > 0 ? (
                      <div className="space-y-4">
                        {feature.images.map((img, imgIndex) => (
                          <Hover3DCard key={imgIndex} intensity={5}>
                            <GlowCard className="rounded-2xl">
                              <div 
                                className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card hover-lift"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none z-10"></div>
                                <img 
                                  src={img} 
                                  alt={`${feature.title} - Capture ${imgIndex + 1}`}
                                  className="w-full h-auto object-cover"
                                />
                              </div>
                            </GlowCard>
                          </Hover3DCard>
                        ))}
                      </div>
                    ) : (
                      <div 
                        className="relative bg-gradient-to-br from-card to-muted rounded-2xl border border-border shadow-xl overflow-hidden aspect-[16/10] group hover:shadow-2xl transition-all duration-500"
                        data-feature-image={feature.id}
                      >
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="h-10 w-10 text-primary" />
                          </div>
                          <p className="text-muted-foreground text-sm md:text-base">
                            Capture d'écran : {feature.title}
                          </p>
                          <p className="text-muted-foreground/60 text-xs mt-2">
                            Image à venir
                          </p>
                        </div>
                        <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="absolute top-4 left-10 w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="absolute top-4 left-16 w-3 h-3 rounded-full bg-green-400"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Prêt à transformer votre gestion ?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10">
            Rejoignez les établissements qui ont déjà adopté NECTFORMA
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/create-establishment" 
              className="group inline-flex items-center px-8 py-4 bg-background text-primary rounded-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all justify-center"
            >
              Créer mon établissement
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/auth" 
              className="inline-flex items-center px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground rounded-xl hover:bg-primary-foreground/10 font-semibold text-lg transition-all justify-center"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Mail className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium">Contactez-nous</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Une question ? <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Parlons-en</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions et vous accompagner dans votre projet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Pourquoi nous contacter ?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Démonstration personnalisée
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Devis sur mesure
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Questions techniques
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    Partenariats et intégrations
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-2xl font-bold text-foreground mb-6">Envoyez-nous un message</h3>
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                
                const formData = new FormData(e.currentTarget);
                const data = {
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  subject: formData.get('subject') as string,
                  message: formData.get('message') as string,
                };

                try {
                  const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-form`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                      },
                      body: JSON.stringify(data),
                    }
                  );

                  const result = await response.json();

                  if (response.ok) {
                    toast.success("Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.");
                    (e.target as HTMLFormElement).reset();
                  } else {
                    throw new Error(result.error || "Erreur lors de l'envoi");
                  }
                } catch (error) {
                  console.error('Error sending contact form:', error);
                  toast.error("Erreur lors de l'envoi du message. Veuillez réessayer.");
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Sujet
                  </label>
                  <Select name="subject" required>
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demande de démonstration</SelectItem>
                      <SelectItem value="devis">Demande de devis</SelectItem>
                      <SelectItem value="support">Support technique</SelectItem>
                      <SelectItem value="partenariat">Partenariat</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Décrivez votre demande..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:shadow-lg transform hover:scale-[1.02] font-semibold text-lg transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  {!isSubmitting && <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 md:py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">NF</span>
                </div>
                <h3 className="text-xl font-bold">NECTFORMA</h3>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                La plateforme complète pour digitaliser et automatiser la gestion de vos formations professionnelles.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#fonctionnalites" className="hover:text-primary transition-colors">Solutions</a></li>
                <li><Link to="/fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/pourquoi-nous" className="hover:text-primary transition-colors">Pourquoi nous ?</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link></li>
                <li><Link to="/politique-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
            <p>© 2024 NECTFORMA. Tous droits réservés.</p>
            <p className="mt-2 md:mt-0">Made with ❤️ for formation professionals</p>
          </div>
        </div>
      </footer>

      {/* Floating Elements */}
      <FloatingCTA />
      <ChatWidget />
       
       {/* Mobile Navigation Drawer */}
       <MobileDrawerNavigation 
         isOpen={isMobileMenuOpen} 
         onClose={() => setIsMobileMenuOpen(false)} 
       />
    </div>
  );
};

export default Index;