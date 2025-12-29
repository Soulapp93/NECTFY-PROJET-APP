import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, ShieldCheck, Users, GraduationCap, BookText, CalendarDays, 
  ClipboardCheck, Mail, UsersRound, Building2, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';

const Solutions = () => {
  const solutions = [
    {
      icon: LayoutDashboard,
      title: 'Tableau de Bord Intelligent',
      description: 'Vue synthétique de votre établissement avec indicateurs clés',
      features: [
        'Statistiques de présence en temps réel',
        'Alertes sur cahiers de textes manquants',
        'Prochaines sessions planifiées',
        'Filtres par formation et période'
      ]
    },
    {
      icon: ShieldCheck,
      title: 'Administration Centralisée',
      description: 'Centre de contrôle unifié avec onglets dédiés',
      features: [
        'Gestion utilisateurs avec import Excel',
        'Formations et modules personnalisés',
        'Cahiers de textes par formation',
        'Emplois du temps visuels',
        'Feuilles d\'émargement automatiques'
      ]
    },
    {
      icon: Users,
      title: 'Gestion des Utilisateurs',
      description: 'Gérez tous les profils de votre établissement',
      features: [
        'Création individuelle ou import Excel',
        'Rôles : AdminPrincipal, Admin, Formateur, Étudiant',
        'Invitations automatiques par email',
        'Activation/désactivation des comptes'
      ]
    },
    {
      icon: GraduationCap,
      title: 'Gestion des Formations',
      description: 'Créez des formations structurées avec modules',
      features: [
        'Structure modulaire flexible',
        'Niveaux : Débutant, Intermédiaire, Avancé',
        'Devoirs et travaux avec soumissions',
        'Documents partagés et corrections'
      ]
    },
    {
      icon: BookText,
      title: 'Cahiers de Textes',
      description: 'Suivi pédagogique détaillé de vos formations',
      features: [
        'Entrées liées aux créneaux EDT',
        'Matière, contenu, travail à faire',
        'Upload de documents de cours',
        'Export PDF des cahiers'
      ]
    },
    {
      icon: CalendarDays,
      title: 'Emplois du Temps',
      description: 'Planning intelligent et flexible',
      features: [
        'Vues jour, semaine, mois, liste',
        'Modules, formateurs, salles',
        'Import Excel des plannings',
        'Notifications des changements'
      ]
    },
    {
      icon: ClipboardCheck,
      title: 'Émargement Numérique',
      description: 'Signatures numériques conformes et sécurisées',
      features: [
        'QR Code dynamique par session',
        'Signature sur écran tactile',
        'Motifs d\'absence configurables',
        'Export PDF des feuilles signées'
      ]
    },
    {
      icon: Mail,
      title: 'Messagerie Interne',
      description: 'Communication professionnelle intégrée',
      features: [
        'Messages avec pièces jointes',
        'Envoi individuel ou groupé',
        'Dossiers organisés',
        'Recherche et historique'
      ]
    },
    {
      icon: UsersRound,
      title: 'Groupes de Discussion',
      description: 'Collaboration en temps réel',
      features: [
        'Groupes automatiques par formation',
        'Chat temps réel',
        'Partage de fichiers',
        'Notifications instantanées'
      ]
    },
    {
      icon: Building2,
      title: 'Gestion Établissement',
      description: 'Configuration et personnalisation',
      features: [
        'Logo et identité visuelle',
        'Informations légales (SIRET)',
        'Coordonnées et contacts',
        'Paramètres de notifications'
      ]
    },
    {
      icon: UserCircle,
      title: 'Profils Utilisateurs',
      description: 'Espace personnel pour chaque utilisateur',
      features: [
        'Photo de profil',
        'Signature électronique enregistrée',
        'Préférences de notifications',
        'Gestion du mot de passe'
      ]
    },
    {
      icon: Briefcase,
      title: 'Espace Tuteurs Entreprises',
      description: 'Suivi dédié pour les tuteurs d\'alternants',
      features: [
        'Planning de l\'alternant',
        'Consultation des présences',
        'Communication avec l\'établissement',
        'Notifications des absences'
      ]
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
              <Link to="/solutions" className="text-primary font-semibold">
                Solutions
              </Link>
              <Link to="/fonctionnalites" className="text-foreground/70 hover:text-primary transition-colors">
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
            <span className="text-primary font-medium">12 modules complets</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Nos Solutions
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Découvrez l'ensemble des modules NECTFY pour digitaliser 
            et automatiser la gestion de votre établissement de formation.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-card rounded-2xl border border-border hover:border-primary hover:shadow-xl transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{solution.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{solution.description}</p>
                  <ul className="space-y-2">
                    {solution.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Prêt à découvrir toutes nos solutions ?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10">
            Testez gratuitement NECTFY pendant 14 jours
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
              <Link to="/fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</Link>
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

export default Solutions;