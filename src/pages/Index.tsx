import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, 
  ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles, Play, Shield, Zap, Clock, Monitor
} from 'lucide-react';

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
  const features: FeatureItem[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Tableau de Bord',
      subtitle: 'Vue d\'ensemble en temps réel',
      description: 'Accédez à une vue synthétique de votre établissement avec des indicateurs clés : taux de présence, sessions à venir, cahiers de textes à compléter, et statistiques globales.',
      benefits: ['Statistiques de présence en temps réel', 'Alertes sur les cahiers de textes manquants', 'Vue des prochaines sessions'],
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
      description: 'Centre de contrôle unifié pour gérer les utilisateurs, formations, cahiers de textes, emplois du temps et feuilles d\'émargement depuis une interface intuitive avec des onglets dédiés.',
      benefits: ['Interface unifiée avec onglets', 'Accès rapide à toutes les fonctions', 'Gestion complète des données'],
      details: [
        'Onglet Utilisateurs : création, import Excel, gestion des rôles',
        'Onglet Formations : modules, participants, instructeurs',
        'Onglet Cahiers de Textes : suivi par formation',
        'Onglet Emplois du Temps : planning visuel',
        'Onglet Émargements : génération et suivi'
      ],
      imagePlaceholder: 'administration',
      images: [administrationImg]
    },
    {
      id: 'users',
      icon: Users,
      title: 'Gestion des Utilisateurs',
      subtitle: 'Apprenants, Formateurs, Administrateurs',
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
      title: 'Gestion des Formations',
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
      title: 'Cahiers de Textes',
      subtitle: 'Suivi pédagogique détaillé',
      description: 'Tenez à jour les cahiers de textes de vos formations. Chaque entrée documente : date, horaires, matière abordée, contenu du cours et travail à faire. Pièces jointes supportées.',
      benefits: ['Entrées liées aux créneaux EDT', 'Historique complet des cours', 'Pièces jointes (PDF, images, etc.)'],
      details: [
        'Création automatique depuis l\'emploi du temps',
        'Champs : matière, contenu, travail à faire',
        'Upload de documents de cours',
        'Vue chronologique par formation',
        'Export PDF des cahiers de textes',
        'Alertes pour entrées manquantes'
      ],
      imagePlaceholder: 'textbooks',
      images: [cahiersTextesImg, cahierTexteDetailImg]
    },
    {
      id: 'schedule',
      icon: CalendarDays,
      title: 'Emplois du Temps',
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
      title: 'Gestion des Émargements',
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
      title: 'Messagerie Interne',
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
      title: 'Groupes Établissement',
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
      title: 'Gestion du Compte Établissement',
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
      title: 'Gestion des Profils',
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
      title: 'Espace Tuteurs Entreprises',
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
      title: 'Classes Virtuelles',
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-sm md:text-lg">N</span>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  NECTFY
                </h1>
              </div>
            </div>
            
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#fonctionnalites" className="text-foreground/70 hover:text-primary font-medium transition-colors">
                Solutions
              </a>
              <Link to="/fonctionnalites" className="text-foreground/70 hover:text-primary font-medium transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pourquoi-nous" className="text-foreground/70 hover:text-primary font-medium transition-colors">
                Pourquoi nous ?
              </Link>
            </nav>

            <div className="flex items-center space-x-2 md:space-x-4">
              <Link 
                to="/auth" 
                className="px-2 py-1.5 md:px-4 md:py-2 text-primary hover:text-primary/80 font-medium transition-colors text-sm md:text-base whitespace-nowrap"
              >
                Se connecter
              </Link>
              <Link 
                to="/create-establishment" 
                className="hidden sm:inline-flex px-3 md:px-6 py-1.5 md:py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:shadow-lg transform hover:scale-105 font-medium transition-all text-xs md:text-base whitespace-nowrap"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-background"></div>
        <div className="absolute top-20 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-64 md:w-[500px] h-64 md:h-[500px] bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto text-center px-2">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6 md:mb-8">
            <Sparkles className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
            <span className="text-primary font-medium text-sm md:text-base">La plateforme tout-en-un pour la formation</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 md:mb-8 leading-tight">
            Gérez vos formations
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              comme jamais
            </span>
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 md:mb-12 max-w-4xl mx-auto leading-relaxed px-2">
            NECTFY est la solution complète pour digitaliser et automatiser 
            la gestion de vos formations. <span className="text-foreground font-medium">12 modules puissants</span> pour tout gérer.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 md:mb-16 px-2">
            <Link 
              to="/create-establishment" 
              className="group px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-xl transform hover:scale-105 font-semibold text-lg transition-all flex items-center justify-center"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#fonctionnalites" 
              className="group px-8 py-4 border-2 border-border text-foreground rounded-xl hover:border-primary hover:text-primary hover:bg-primary/5 font-semibold text-lg transition-all flex items-center justify-center"
            >
              <Play className="mr-2 h-5 w-5" />
              Découvrir les solutions
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm md:text-base text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
              <span>Données sécurisées</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
              <span>Support réactif</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Count Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-primary-foreground">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">12</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Modules complets</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Dématérialisé</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Accessible</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">∞</div>
              <div className="text-primary-foreground/80 text-sm md:text-base">Utilisateurs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
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
          </div>

          <div className="space-y-24 md:space-y-32">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              
              return (
                <div 
                  key={feature.id}
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
                          <div 
                            key={imgIndex}
                            className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card"
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none z-10"></div>
                            <img 
                              src={img} 
                              alt={`${feature.title} - Capture ${imgIndex + 1}`}
                              className="w-full h-auto object-cover"
                            />
                          </div>
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
                </div>
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
            Rejoignez les établissements qui ont déjà adopté NECTFY
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

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 md:py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">N</span>
                </div>
                <h3 className="text-xl font-bold">NECTFY</h3>
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
            <p>© 2024 NECTFY. Tous droits réservés.</p>
            <p className="mt-2 md:mt-0">Made with ❤️ for formation professionals</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;