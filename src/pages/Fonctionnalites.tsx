import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, 
  ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles, Smartphone, FileDown, QrCode, 
  Upload, Bell, Search, Monitor
} from 'lucide-react';

const Fonctionnalites = () => {
  const mainFeatures = [
    {
      icon: LayoutDashboard,
      category: 'Pilotage',
      title: 'Tableau de Bord',
      description: 'Vue synthétique avec indicateurs clés de votre établissement',
      details: [
        'Statistiques de présence en temps réel',
        'Alertes cahiers de textes manquants',
        'Sessions à venir',
        'Filtres par formation'
      ]
    },
    {
      icon: ShieldCheck,
      category: 'Administration',
      title: 'Administration Centralisée',
      description: 'Gérez tout depuis une interface unique avec onglets',
      details: [
        'Onglet Utilisateurs',
        'Onglet Formations',
        'Onglet Cahiers de Textes',
        'Onglet Emplois du Temps',
        'Onglet Émargements'
      ]
    },
    {
      icon: Users,
      category: 'Utilisateurs',
      title: 'Gestion des Utilisateurs',
      description: 'Apprenants, formateurs et administrateurs',
      details: [
        'Import/Export Excel',
        'Rôles multiples',
        'Invitations par email',
        'Activation/désactivation'
      ]
    },
    {
      icon: GraduationCap,
      category: 'Formations',
      title: 'Gestion des Formations',
      description: 'Programmes modulaires et contenus pédagogiques',
      details: [
        'Modules personnalisés',
        'Devoirs et soumissions',
        'Documents partagés',
        'Corrections et notes'
      ]
    },
    {
      icon: BookText,
      category: 'Pédagogie',
      title: 'Cahiers de Textes',
      description: 'Documentation complète de vos cours',
      details: [
        'Matière et contenu',
        'Travail à faire',
        'Pièces jointes',
        'Export PDF'
      ]
    },
    {
      icon: CalendarDays,
      category: 'Planning',
      title: 'Emplois du Temps',
      description: 'Calendrier interactif et flexible',
      details: [
        'Vues multiples',
        'Import Excel',
        'Gestion salles',
        'Notifications'
      ]
    },
    {
      icon: ClipboardCheck,
      category: 'Émargement',
      title: 'Signatures Numériques',
      description: 'Émargement conforme et sécurisé',
      details: [
        'QR Code dynamique',
        'Signature tactile',
        'Motifs d\'absence',
        'Validation admin'
      ]
    },
    {
      icon: Mail,
      category: 'Communication',
      title: 'Messagerie Interne',
      description: 'Échanges professionnels intégrés',
      details: [
        'Pièces jointes',
        'Envoi groupé',
        'Dossiers organisés',
        'Recherche'
      ]
    },
    {
      icon: UsersRound,
      category: 'Collaboration',
      title: 'Groupes de Discussion',
      description: 'Chat et collaboration en temps réel',
      details: [
        'Groupes par formation',
        'Messages instantanés',
        'Partage fichiers',
        'Notifications'
      ]
    },
    {
      icon: Building2,
      category: 'Configuration',
      title: 'Gestion Établissement',
      description: 'Paramètres et personnalisation',
      details: [
        'Logo personnalisé',
        'Informations légales',
        'Coordonnées',
        'Paramètres'
      ]
    },
    {
      icon: UserCircle,
      category: 'Profils',
      title: 'Comptes Utilisateurs',
      description: 'Espace personnel pour chacun',
      details: [
        'Photo de profil',
        'Signature enregistrée',
        'Préférences',
        'Sécurité'
      ]
    },
    {
      icon: Briefcase,
      category: 'Alternance',
      title: 'Espace Tuteurs',
      description: 'Suivi des alternants par les tuteurs entreprises',
      details: [
        'Planning alternant',
        'Présences',
        'Communication',
        'Alertes absences'
      ]
    },
    {
      icon: Monitor,
      category: 'À venir',
      title: 'Classes Virtuelles',
      description: 'Sessions de formation en ligne avec visioconférence intégrée',
      details: [
        'Visioconférence HD',
        'Partage d\'écran',
        'Enregistrement sessions',
        'Chat en direct'
      ],
      comingSoon: true
    }
  ];

  const additionalFeatures = [
    {
      icon: QrCode,
      title: 'QR Code Dynamique',
      description: 'Émargement rapide et sécurisé via scan mobile'
    },
    {
      icon: Upload,
      title: 'Import Excel',
      description: 'Importez utilisateurs et plannings massivement'
    },
    {
      icon: FileDown,
      title: 'Export PDF',
      description: 'Exportez feuilles de présence et cahiers de textes'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Alertes en temps réel sur les événements importants'
    },
    {
      icon: Search,
      title: 'Recherche Avancée',
      description: 'Trouvez rapidement utilisateurs et formations'
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Accès complet depuis tous vos appareils'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                NECTFY
              </h1>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-foreground/70 hover:text-primary transition-colors">
                Solutions
              </Link>
              <Link to="/fonctionnalites" className="text-primary font-semibold">
                Fonctionnalités
              </Link>
              <Link to="/pourquoi-nous" className="text-foreground/70 hover:text-primary transition-colors">
                Pourquoi nous ?
              </Link>
            </nav>

            <div className="flex space-x-4">
              <Link 
                to="/auth" 
                className="px-4 py-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Se connecter
              </Link>
              <Link 
                to="/create-establishment" 
                className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:shadow-lg transform hover:scale-105 font-medium transition-all"
              >
                Essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-primary font-medium">Tout ce dont vous avez besoin</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Toutes les Fonctionnalités
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Découvrez en détail chaque fonctionnalité de NECTFY, 
            conçue pour simplifier la gestion de vos formations.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">13 Modules Principaux</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour gérer tous les aspects de votre établissement
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isComingSoon = 'comingSoon' in feature && feature.comingSoon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-card rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all group relative"
                >
                  {isComingSoon && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full shadow-md">
                      À venir
                    </div>
                  )}
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${isComingSoon ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-primary to-accent'} rounded-lg flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isComingSoon ? 'text-amber-600' : 'text-primary'}`}>
                      {feature.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start text-sm text-muted-foreground">
                        <CheckCircle2 className={`h-4 w-4 ${isComingSoon ? 'text-amber-500' : 'text-green-500'} mr-2 mt-0.5 flex-shrink-0`} />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Fonctionnalités Additionnelles</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des outils supplémentaires pour optimiser votre productivité
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-card rounded-xl border border-border hover:border-primary transition-all flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Accessible partout, à tout moment
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              NECTFY est optimisé pour tous vos appareils : ordinateur, tablette et smartphone.
              Gérez vos formations où que vous soyez.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Testez toutes ces fonctionnalités gratuitement
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10">
            14 jours d'essai gratuit • Sans engagement • Support inclus
          </p>
          <Link 
            to="/create-establishment" 
            className="inline-flex items-center px-8 py-4 bg-background text-primary rounded-lg hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
          >
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">NECTFY</h3>
                <p className="text-muted-foreground text-sm">© 2024 Tous droits réservés</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
              <Link to="/" className="hover:text-primary transition-colors">Solutions</Link>
              <Link to="/pourquoi-nous" className="hover:text-primary transition-colors">Pourquoi nous ?</Link>
              <Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link>
              <Link to="/politique-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Fonctionnalites;