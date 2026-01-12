import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, Users, Award, Zap, Heart, TrendingUp, 
  Shield, Clock, CheckCircle2, ArrowRight, Star,
  GraduationCap, Building2, Briefcase, Sparkles
} from 'lucide-react';

const PourquoiNous = () => {
  const audiences = [
    {
      icon: GraduationCap,
      title: 'Centres de Formation',
      description: 'Vous gérez un organisme de formation et souhaitez optimiser vos processus ?',
      benefits: [
        'Gestion complète des formations et modules',
        'Émargement numérique conforme',
        'Cahiers de textes automatisés',
        'Emplois du temps visuels',
        'Suivi des apprenants en temps réel'
      ],
      testimonial: {
        text: 'NECTFORMA a transformé notre gestion quotidienne. Nous avons divisé par 3 le temps administratif !',
        author: 'Marie D., Directrice de CFA'
      }
    },
    {
      icon: Building2,
      title: 'Établissements d\'Enseignement',
      description: 'Vous êtes un établissement scolaire ou universitaire ?',
      benefits: [
        'Interface intuitive pour tous les profils',
        'Messagerie et groupes intégrés',
        'Gestion multi-formations',
        'Suivi pédagogique complet',
        'Exports et rapports détaillés'
      ],
      testimonial: {
        text: 'La plateforme est adoptée par tous nos formateurs et étudiants. Simple et efficace !',
        author: 'Jean-Pierre L., Responsable pédagogique'
      }
    },
    {
      icon: Briefcase,
      title: 'Entreprises avec Alternants',
      description: 'Vous accueillez des alternants et souhaitez suivre leur formation ?',
      benefits: [
        'Espace tuteur entreprise dédié',
        'Suivi des présences de l\'alternant',
        'Communication avec l\'établissement',
        'Accès au planning de formation',
        'Notifications des absences'
      ],
      testimonial: {
        text: 'En tant que tuteur, je peux enfin suivre facilement la formation de mes alternants.',
        author: 'Sophie M., Tutrice entreprise'
      }
    }
  ];

  const whyChooseUs = [
    {
      icon: Zap,
      title: 'Simplicité d\'utilisation',
      description: 'Interface intuitive, prise en main immédiate sans formation nécessaire'
    },
    {
      icon: Clock,
      title: 'Gain de temps massif',
      description: 'Automatisation des tâches administratives répétitives'
    },
    {
      icon: Shield,
      title: 'Sécurité des données',
      description: 'Vos données sont hébergées et protégées de manière sécurisée'
    },
    {
      icon: Heart,
      title: 'Support réactif',
      description: 'Équipe disponible pour vous accompagner au quotidien'
    },
    {
      icon: TrendingUp,
      title: 'Évolution continue',
      description: 'Nouvelles fonctionnalités régulières basées sur vos retours'
    },
    {
      icon: Star,
      title: 'Satisfaction client',
      description: 'Des établissements satisfaits qui nous recommandent'
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
                <span className="text-primary-foreground font-bold text-sm">NF</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                NECTFORMA
              </h1>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/solutions" className="text-foreground/70 hover:text-primary transition-colors">
                Solutions
              </Link>
              <Link to="/fonctionnalites" className="text-foreground/70 hover:text-primary transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pourquoi-nous" className="text-primary font-semibold">
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
            <span className="text-primary font-medium">La solution adaptée à vos besoins</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Pourquoi choisir NECTFORMA ?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            NECTFORMA s'adapte à tous les professionnels de la formation, 
            quelle que soit la taille de votre structure.
          </p>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              const isEven = index % 2 === 0;
              return (
                <div 
                  key={index}
                  className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                        <Icon className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <h2 className="text-3xl font-bold text-foreground">{audience.title}</h2>
                    </div>
                    <p className="text-xl text-muted-foreground mb-8">{audience.description}</p>
                    <ul className="space-y-4 mb-8">
                      {audience.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start">
                          <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-lg text-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1">
                    <div className="p-8 bg-card rounded-2xl border border-border shadow-lg">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-lg text-muted-foreground italic mb-4">
                        "{audience.testimonial.text}"
                      </p>
                      <p className="text-foreground font-semibold">{audience.testimonial.author}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Les avantages NECTFORMA
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Plus qu'un simple logiciel, un véritable partenaire pour votre réussite
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyChooseUs.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <div 
                  key={index}
                  className="p-6 bg-card rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{reason.title}</h3>
                  <p className="text-muted-foreground">{reason.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">12</div>
              <div className="text-muted-foreground">Modules complets</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Dématérialisé</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Accessible</div>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-primary mb-2">∞</div>
              <div className="text-muted-foreground">Utilisateurs</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-6">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10">
            Testez NECTFORMA gratuitement pendant 14 jours, sans engagement
          </p>
          <Link 
            to="/create-establishment" 
            className="inline-flex items-center px-8 py-4 bg-background text-primary rounded-lg hover:shadow-2xl transform hover:scale-105 font-bold text-lg transition-all"
          >
            Commencer gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-primary-foreground/80 mt-6 text-sm">
            Sans carte bancaire • Support inclus • Données sécurisées
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">NF</span>
              </div>
              <div>
                <h3 className="text-xl font-bold">NECTFORMA</h3>
                <p className="text-muted-foreground text-sm">© 2024 Tous droits réservés</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
              <Link to="/solutions" className="hover:text-primary transition-colors">Solutions</Link>
              <Link to="/fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</Link>
              <Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link>
              <Link to="/politique-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PourquoiNous;