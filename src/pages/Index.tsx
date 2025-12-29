import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, Users, BookOpen, FileText, Calendar, 
  ClipboardCheck, MessageSquare, Building2, Building, UserCircle, Briefcase,
  ArrowRight, CheckCircle2, Sparkles, Play, Shield, Zap, Clock
} from 'lucide-react';

interface FeatureItem {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  imagePlaceholder: string;
}

const Index = () => {
  const features: FeatureItem[] = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Tableau de Bord',
      subtitle: 'Vue d\'ensemble complète',
      description: 'Visualisez en un coup d\'œil toutes les métriques importantes de votre établissement. Statistiques en temps réel, alertes et indicateurs clés pour piloter votre activité.',
      benefits: ['Statistiques en temps réel', 'Alertes personnalisées', 'Indicateurs de performance'],
      imagePlaceholder: 'dashboard'
    },
    {
      id: 'administration',
      icon: Settings,
      title: 'Administration',
      subtitle: 'Gestion centralisée',
      description: 'Administrez l\'ensemble de votre établissement depuis une interface unique. Paramètres, configurations et outils d\'administration avancés.',
      benefits: ['Configuration complète', 'Gestion des permissions', 'Paramètres avancés'],
      imagePlaceholder: 'administration'
    },
    {
      id: 'users',
      icon: Users,
      title: 'Gestion des Utilisateurs',
      subtitle: 'Apprenants, formateurs, administrateurs',
      description: 'Gérez tous les profils de votre établissement. Création de comptes, attribution de rôles, suivi des activités et gestion des accès.',
      benefits: ['Import/Export Excel', 'Gestion des rôles', 'Suivi des activités'],
      imagePlaceholder: 'users'
    },
    {
      id: 'formations',
      icon: BookOpen,
      title: 'Gestion des Formations',
      subtitle: 'Programmes et modules',
      description: 'Créez et organisez vos formations avec des modules personnalisés. Définissez les objectifs, le contenu pédagogique et suivez la progression.',
      benefits: ['Modules personnalisables', 'Objectifs pédagogiques', 'Suivi de progression'],
      imagePlaceholder: 'formations'
    },
    {
      id: 'textbooks',
      icon: FileText,
      title: 'Cahiers de Textes',
      subtitle: 'Documentation pédagogique',
      description: 'Tenez à jour les cahiers de textes de vos formations. Historique des cours, contenus abordés et ressources partagées.',
      benefits: ['Historique complet', 'Pièces jointes', 'Export PDF'],
      imagePlaceholder: 'textbooks'
    },
    {
      id: 'schedule',
      icon: Calendar,
      title: 'Emplois du Temps',
      subtitle: 'Planning intelligent',
      description: 'Planifiez et visualisez les séances de formation. Vue calendrier, gestion des salles et des disponibilités des formateurs.',
      benefits: ['Vue calendrier', 'Gestion des salles', 'Notifications automatiques'],
      imagePlaceholder: 'schedule'
    },
    {
      id: 'attendance',
      icon: ClipboardCheck,
      title: 'Gestion des Émargements',
      subtitle: 'Signatures numériques et QR codes',
      description: 'Émargement digital conforme et sécurisé. Signatures électroniques, QR codes dynamiques et feuilles de présence automatiques.',
      benefits: ['QR Code dynamique', 'Signature électronique', 'Conformité légale'],
      imagePlaceholder: 'attendance'
    },
    {
      id: 'messaging',
      icon: MessageSquare,
      title: 'Messagerie Interne',
      subtitle: 'Communication centralisée',
      description: 'Communiquez facilement avec tous les acteurs de votre établissement. Messages, notifications et historique des échanges.',
      benefits: ['Messages instantanés', 'Pièces jointes', 'Historique complet'],
      imagePlaceholder: 'messaging'
    },
    {
      id: 'groups',
      icon: Building2,
      title: 'Groupes Établissement',
      subtitle: 'Discussions de groupe',
      description: 'Créez des groupes de discussion pour vos formations, équipes ou projets. Collaboration en temps réel et partage de ressources.',
      benefits: ['Groupes personnalisés', 'Partage de fichiers', 'Discussions en temps réel'],
      imagePlaceholder: 'groups'
    },
    {
      id: 'establishment',
      icon: Building,
      title: 'Gestion Établissement',
      subtitle: 'Paramètres et identité',
      description: 'Configurez les informations de votre établissement. Logo, coordonnées, paramètres légaux et personnalisation de l\'interface.',
      benefits: ['Personnalisation', 'Informations légales', 'Branding'],
      imagePlaceholder: 'establishment'
    },
    {
      id: 'profiles',
      icon: UserCircle,
      title: 'Gestion des Profils',
      subtitle: 'Comptes utilisateurs',
      description: 'Chaque utilisateur peut gérer son profil personnel. Photo, signature, préférences de notification et paramètres de confidentialité.',
      benefits: ['Photo de profil', 'Signature enregistrée', 'Préférences personnelles'],
      imagePlaceholder: 'profiles'
    },
    {
      id: 'tutors',
      icon: Briefcase,
      title: 'Espace Tuteurs Entreprises',
      subtitle: 'Suivi des alternants',
      description: 'Espace dédié aux tuteurs entreprises pour le suivi des alternants. Visualisation des plannings, des présences et communication avec l\'établissement.',
      benefits: ['Suivi alternants', 'Planning visible', 'Communication directe'],
      imagePlaceholder: 'tutors'
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
                Fonctionnalités
              </a>
              <Link to="/solutions" className="text-foreground/70 hover:text-primary font-medium transition-colors">
                Solutions
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
              Découvrir les fonctionnalités
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
              Toutes les fonctionnalités dont vous avez besoin
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
                    
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-foreground">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-base md:text-lg">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Image Placeholder */}
                  <div className="flex-1 w-full max-w-2xl">
                    <div 
                      className="relative bg-gradient-to-br from-card to-muted rounded-2xl border border-border shadow-xl overflow-hidden aspect-[16/10] group hover:shadow-2xl transition-all duration-500"
                      data-feature-image={feature.id}
                    >
                      {/* Placeholder content */}
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
                      
                      {/* Decorative elements */}
                      <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="absolute top-4 left-10 w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="absolute top-4 left-16 w-3 h-3 rounded-full bg-green-400"></div>
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
                    </div>
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
            Rejoignez des centaines d'établissements qui font déjà confiance à NECTFY
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/create-establishment" 
              className="inline-flex items-center px-8 py-4 bg-background text-primary rounded-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
            >
              Créer un compte gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/auth" 
              className="inline-flex items-center px-8 py-4 border-2 border-primary-foreground/30 text-primary-foreground rounded-xl hover:bg-primary-foreground/10 font-semibold text-lg transition-all"
            >
              Se connecter
            </Link>
          </div>
          <p className="text-primary-foreground/70 mt-8 text-sm md:text-base">
            Essai gratuit 14 jours • Sans engagement • Support inclus
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">N</span>
                </div>
                <h3 className="text-2xl font-bold">NECTFY</h3>
              </div>
              <p className="text-background/60 max-w-md text-sm md:text-base">
                La plateforme de gestion complète pour digitaliser votre établissement de formation. 12 modules puissants pour tout gérer.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Navigation</h4>
              <ul className="space-y-2 text-background/60 text-sm">
                <li><a href="#fonctionnalites" className="hover:text-background transition-colors">Fonctionnalités</a></li>
                <li><Link to="/solutions" className="hover:text-background transition-colors">Solutions</Link></li>
                <li><Link to="/pourquoi-nous" className="hover:text-background transition-colors">Pourquoi nous ?</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-sm md:text-base">Légal</h4>
              <ul className="space-y-2 text-background/60 text-sm">
                <li><Link to="/cgu" className="hover:text-background transition-colors">CGU</Link></li>
                <li><Link to="/politique-confidentialite" className="hover:text-background transition-colors">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-background/20 pt-8">
            <p className="text-background/50 text-center text-xs md:text-sm">
              © 2024 NECTFY. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
