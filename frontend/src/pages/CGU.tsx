import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Scale, Users, Database, Mail, Gavel } from 'lucide-react';
import AnimatedSection from '@/components/landing/AnimatedSection';

const CGU = () => {
  const sections = [
    {
      icon: FileText,
      title: "1. Objet",
      content: [
        "Les présentes Conditions Générales d'Utilisation (ci-après \"CGU\") ont pour objet de définir les modalités et conditions d'utilisation de la plateforme NECTFORMA (ci-après \"la Plateforme\"), ainsi que les droits et obligations des parties dans ce cadre.",
        "L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU."
      ]
    },
    {
      icon: Users,
      title: "2. Accès à la Plateforme",
      content: [
        "La Plateforme est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. Tous les frais supportés par l'utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.",
        "NECTFORMA met en œuvre tous les moyens raisonnables à sa disposition pour assurer un accès de qualité à la Plateforme, mais n'est tenue à aucune obligation d'y parvenir."
      ]
    },
    {
      icon: CheckCircle2,
      title: "3. Création de Compte",
      content: [
        "Pour utiliser la Plateforme, l'utilisateur doit créer un compte en fournissant des informations exactes et à jour. L'utilisateur s'engage à :"
      ],
      list: [
        "Fournir des informations exactes, complètes et à jour",
        "Maintenir la confidentialité de ses identifiants de connexion",
        "Informer immédiatement NECTFORMA de toute utilisation non autorisée de son compte",
        "Ne pas créer de compte pour le compte d'un tiers sans autorisation"
      ]
    },
    {
      icon: Database,
      title: "4. Services Proposés",
      content: [
        "NECTFORMA propose une plateforme de gestion de formations incluant notamment :"
      ],
      list: [
        "La gestion des formations et modules pédagogiques",
        "L'émargement numérique et signatures électroniques",
        "La planification des emplois du temps",
        "La gestion des utilisateurs (formateurs, apprenants, administrateurs)",
        "La messagerie intégrée",
        "Le stockage sécurisé de documents",
        "Les tableaux de bord et statistiques"
      ]
    },
    {
      icon: Scale,
      title: "5. Propriété Intellectuelle",
      content: [
        "Tous les contenus présents sur la Plateforme (textes, images, graphismes, logo, vidéos, etc.) sont la propriété exclusive de NECTFORMA ou de ses partenaires et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.",
        "Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de la Plateforme, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de NECTFORMA."
      ]
    },
    {
      icon: Database,
      title: "6. Protection des Données Personnelles",
      content: [
        "NECTFORMA s'engage à respecter la réglementation applicable en matière de protection des données personnelles, notamment le Règlement Général sur la Protection des Données (RGPD)."
      ],
      link: {
        text: "Pour plus d'informations sur la collecte et le traitement de vos données personnelles, veuillez consulter notre ",
        linkText: "Politique de Confidentialité",
        to: "/politique-confidentialite"
      }
    },
    {
      icon: AlertCircle,
      title: "7. Responsabilités",
      content: [
        "NECTFORMA ne peut être tenue responsable :"
      ],
      list: [
        "Des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès à la Plateforme",
        "De l'utilisation frauduleuse ou abusive de la Plateforme par un utilisateur",
        "De l'impossibilité d'accéder temporairement à la Plateforme pour des opérations de maintenance",
        "Des contenus publiés par les utilisateurs sur la Plateforme"
      ]
    },
    {
      icon: FileText,
      title: "8. Modification des CGU",
      content: [
        "NECTFORMA se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de ces modifications par email et/ou par un avis sur la Plateforme. La poursuite de l'utilisation de la Plateforme après ces modifications vaut acceptation des nouvelles CGU."
      ]
    },
    {
      icon: AlertCircle,
      title: "9. Résiliation",
      content: [
        "L'utilisateur peut résilier son compte à tout moment depuis les paramètres de son compte ou en contactant le support NECTFORMA.",
        "NECTFORMA se réserve le droit de suspendre ou de supprimer le compte d'un utilisateur en cas de violation des présentes CGU, sans préavis ni indemnité."
      ]
    },
    {
      icon: Gavel,
      title: "10. Droit Applicable et Juridiction",
      content: [
        "Les présentes CGU sont régies par le droit français. En cas de litige relatif à l'interprétation ou à l'exécution des présentes, et à défaut d'accord amiable, les tribunaux français seront seuls compétents."
      ]
    },
    {
      icon: Mail,
      title: "11. Contact",
      content: [
        "Pour toute question concernant les présentes CGU, vous pouvez nous contacter à l'adresse :"
      ],
      email: "contact@nectforma.com"
    }
  ];

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
              <FileText className="h-10 w-10 text-primary-foreground" />
            </div>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={100}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Conditions Générales{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                d'Utilisation
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fade-up" delay={200}>
            <p className="text-lg text-muted-foreground mb-6">
              Veuillez lire attentivement ces conditions avant d'utiliser notre plateforme
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></span>
              Dernière mise à jour : 20 octobre 2024
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
                      
                      {section.list && (
                        <ul className="space-y-3 mt-4">
                          {section.list.map((item, lIndex) => (
                            <li key={lIndex} className="flex items-start text-muted-foreground">
                              <CheckCircle2 className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {section.link && (
                        <p className="text-muted-foreground mt-4">
                          {section.link.text}
                          <Link to={section.link.to} className="text-primary hover:underline font-medium">
                            {section.link.linkText}
                          </Link>.
                        </p>
                      )}
                      
                      {section.email && (
                        <a 
                          href={`mailto:${section.email}`} 
                          className="inline-flex items-center mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {section.email}
                        </a>
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
              <Link to="/politique-confidentialite" className="hover:text-primary transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CGU;
