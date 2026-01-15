import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2, Database, Lock, Eye, FileText, Mail, Users, Cookie, AlertCircle } from 'lucide-react';
import AnimatedSection from '@/components/landing/AnimatedSection';

const PolitiqueConfidentialite = () => {
  const sections = [
    {
      icon: Shield,
      title: "1. Introduction",
      content: [
        "NECTFORMA (ci-après \"nous\", \"notre\" ou \"la Société\") s'engage à protéger la confidentialité et la sécurité des données personnelles de ses utilisateurs. La présente Politique de Confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos données personnelles lorsque vous utilisez notre plateforme.",
        "Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés."
      ]
    },
    {
      icon: Database,
      title: "2. Données Collectées",
      content: [
        "Nous collectons les données personnelles suivantes :"
      ],
      subsections: [
        {
          subtitle: "2.1. Données d'identification",
          items: ["Nom et prénom", "Adresse email", "Numéro de téléphone", "Identifiants de connexion"]
        },
        {
          subtitle: "2.2. Données d'utilisation",
          items: ["Historique de navigation sur la plateforme", "Données de connexion (adresse IP, type de navigateur, système d'exploitation)", "Données d'interaction avec la plateforme"]
        },
        {
          subtitle: "2.3. Données pédagogiques",
          items: ["Informations sur les formations suivies ou dispensées", "Données d'émargement et de présence", "Documents et contenus pédagogiques", "Résultats et évaluations"]
        }
      ]
    },
    {
      icon: FileText,
      title: "3. Finalités du Traitement",
      content: [
        "Vos données personnelles sont collectées et traitées pour les finalités suivantes :"
      ],
      list: [
        "Création et gestion de votre compte utilisateur",
        "Fourniture et amélioration de nos services",
        "Gestion des formations et du suivi pédagogique",
        "Communication avec vous (support, notifications, informations importantes)",
        "Respect de nos obligations légales et réglementaires",
        "Analyse statistique et amélioration de nos services",
        "Sécurité et prévention de la fraude"
      ]
    },
    {
      icon: CheckCircle2,
      title: "4. Base Légale du Traitement",
      content: [
        "Le traitement de vos données personnelles repose sur les bases légales suivantes :"
      ],
      list: [
        "**Exécution du contrat :** Pour fournir les services demandés",
        "**Consentement :** Pour certaines communications marketing",
        "**Obligation légale :** Pour respecter nos obligations réglementaires",
        "**Intérêt légitime :** Pour améliorer nos services et assurer la sécurité"
      ]
    },
    {
      icon: Users,
      title: "5. Partage des Données",
      content: [
        "Nous ne vendons ni ne louons vos données personnelles. Nous pouvons partager vos données avec :"
      ],
      list: [
        "**Prestataires de services :** Pour l'hébergement, le support technique, etc.",
        "**Autorités compétentes :** Si requis par la loi",
        "**Votre organisme de formation :** Dans le cadre de votre inscription"
      ],
      footer: "Tous nos prestataires sont soumis à des obligations strictes de confidentialité et de sécurité."
    },
    {
      icon: Database,
      title: "6. Conservation des Données",
      content: [
        "Nous conservons vos données personnelles :"
      ],
      list: [
        "Pendant la durée de votre utilisation de la plateforme",
        "Pour la durée nécessaire aux finalités pour lesquelles elles ont été collectées",
        "Conformément aux obligations légales de conservation (notamment 3 ans pour les données de formation)"
      ],
      footer: "Après cette période, vos données sont supprimées ou anonymisées de manière sécurisée."
    },
    {
      icon: Lock,
      title: "7. Sécurité des Données",
      content: [
        "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre :"
      ],
      list: [
        "L'accès non autorisé",
        "La divulgation",
        "La modification",
        "La destruction"
      ],
      footer: "Ces mesures incluent notamment le chiffrement des données, des protocoles de sécurité avancés, et des contrôles d'accès stricts."
    },
    {
      icon: Eye,
      title: "8. Vos Droits",
      content: [
        "Conformément au RGPD, vous disposez des droits suivants :"
      ],
      list: [
        "**Droit d'accès :** Obtenir une copie de vos données personnelles",
        "**Droit de rectification :** Corriger vos données inexactes ou incomplètes",
        "**Droit à l'effacement :** Demander la suppression de vos données",
        "**Droit à la limitation :** Limiter le traitement de vos données",
        "**Droit à la portabilité :** Recevoir vos données dans un format structuré",
        "**Droit d'opposition :** Vous opposer au traitement de vos données",
        "**Droit de retirer votre consentement :** À tout moment"
      ],
      email: "privacy@nectforma.com",
      emailLabel: "Pour exercer ces droits, contactez-nous à :"
    },
    {
      icon: Cookie,
      title: "9. Cookies",
      content: [
        "Notre plateforme utilise des cookies pour :"
      ],
      list: [
        "Assurer le bon fonctionnement de la plateforme",
        "Mémoriser vos préférences",
        "Analyser l'utilisation de nos services",
        "Améliorer votre expérience utilisateur"
      ],
      footer: "Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités de la plateforme."
    },
    {
      icon: FileText,
      title: "10. Modifications",
      content: [
        "Nous pouvons modifier cette Politique de Confidentialité à tout moment. Les modifications entreront en vigueur dès leur publication sur la plateforme. Nous vous informerons de tout changement significatif par email ou notification sur la plateforme."
      ]
    },
    {
      icon: AlertCircle,
      title: "11. Réclamations",
      content: [
        "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) :"
      ],
      contactInfo: {
        name: "CNIL",
        address: "3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07",
        phone: "01 53 73 22 22",
        website: "www.cnil.fr"
      }
    },
    {
      icon: Mail,
      title: "12. Contact",
      content: [
        "Pour toute question concernant cette Politique de Confidentialité ou le traitement de vos données, vous pouvez nous contacter :"
      ],
      contactDetails: {
        email: "privacy@nectforma.com",
        address: "NECTFORMA - Service Protection des Données"
      }
    }
  ];

  const renderListItem = (item: string) => {
    if (item.includes('**')) {
      const parts = item.split('**');
      return (
        <>
          <strong className="text-foreground">{parts[1]}</strong>
          {parts[2]}
        </>
      );
    }
    return item;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-primary-foreground font-bold text-sm">NF</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                NECTFORMA
              </h1>
            </Link>
            
            <Link 
              to="/" 
              className="flex items-center text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
        <div className="absolute top-10 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="scale">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg mb-6">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={100}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Politique de{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Confidentialité
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={200}>
            <p className="text-lg text-muted-foreground mb-6">
              Nous nous engageons à protéger vos données personnelles
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></span>
              Dernière mise à jour : 20 octobre 2024
            </div>
          </AnimatedSection>

          {/* Trust Badges */}
          <AnimatedSection animation="fade-up" delay={300} className="mt-8">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center px-4 py-2 bg-card border border-border rounded-full">
                <Lock className="h-4 w-4 text-success mr-2" />
                <span className="text-sm text-foreground">Conforme RGPD</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-card border border-border rounded-full">
                <Shield className="h-4 w-4 text-info mr-2" />
                <span className="text-sm text-foreground">Données chiffrées</span>
              </div>
              <div className="flex items-center px-4 py-2 bg-card border border-border rounded-full">
                <Database className="h-4 w-4 text-primary mr-2" />
                <span className="text-sm text-foreground">Hébergé en France</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <AnimatedSection 
                  key={index} 
                  animation="fade-up" 
                  delay={index * 50}
                >
                  <div className="bg-card border border-border rounded-2xl p-6 md:p-8 hover:shadow-lg transition-shadow hover:border-primary/20">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-foreground pt-2">
                        {section.title}
                      </h2>
                    </div>
                    
                    <div className="pl-16">
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                      
                      {section.subsections && (
                        <div className="space-y-6 mt-4">
                          {section.subsections.map((sub, sIndex) => (
                            <div key={sIndex}>
                              <h3 className="text-lg font-semibold text-foreground mb-3">{sub.subtitle}</h3>
                              <ul className="space-y-2">
                                {sub.items.map((item, iIndex) => (
                                  <li key={iIndex} className="flex items-start text-muted-foreground">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {section.list && (
                        <ul className="space-y-3 mt-4">
                          {section.list.map((item, lIndex) => (
                            <li key={lIndex} className="flex items-start text-muted-foreground">
                              <CheckCircle2 className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                              <span>{renderListItem(item)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {section.footer && (
                        <p className="text-muted-foreground mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                          {section.footer}
                        </p>
                      )}
                      
                      {section.email && (
                        <div className="mt-4">
                          <p className="text-muted-foreground mb-2">{section.emailLabel}</p>
                          <a 
                            href={`mailto:${section.email}`} 
                            className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {section.email}
                          </a>
                        </div>
                      )}
                      
                      {section.contactInfo && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <p className="font-semibold text-foreground">{section.contactInfo.name}</p>
                          <p className="text-muted-foreground">{section.contactInfo.address}</p>
                          <p className="text-muted-foreground">Téléphone : {section.contactInfo.phone}</p>
                          <a 
                            href={`https://${section.contactInfo.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline"
                          >
                            {section.contactInfo.website}
                          </a>
                        </div>
                      )}
                      
                      {section.contactDetails && (
                        <div className="mt-4 space-y-2">
                          <a 
                            href={`mailto:${section.contactDetails.email}`} 
                            className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {section.contactDetails.email}
                          </a>
                          <p className="text-muted-foreground">{section.contactDetails.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-foreground py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
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
              <Link to="/fonctionnalites" className="hover:text-primary transition-colors">Fonctionnalités</Link>
              <Link to="/pourquoi-nous" className="hover:text-primary transition-colors">Pourquoi nous ?</Link>
              <Link to="/cgu" className="hover:text-primary transition-colors">CGU</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PolitiqueConfidentialite;
