import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Comment créer un compte sur NECTFORMA ?",
    answer: "Pour créer un compte, cliquez sur 'Créer un compte' en haut de la page. Vous serez guidé pour configurer votre établissement, ajouter vos informations et commencer à utiliser la plateforme. L'essai de 14 jours est entièrement gratuit, sans engagement."
  },
  {
    question: "Quels types d'établissements peuvent utiliser NECTFORMA ?",
    answer: "NECTFORMA s'adapte à tous les organismes de formation : centres de formation professionnelle, écoles, universités, CFA, organismes de formation continue, et même les entreprises avec leur propre académie interne."
  },
  {
    question: "Comment fonctionne le système d'émargement numérique ?",
    answer: "Notre système génère automatiquement des feuilles d'émargement à partir de votre emploi du temps. Les apprenants signent électroniquement via leur smartphone en scannant un QR code unique. Les signatures sont horodatées et sécurisées pour garantir la conformité réglementaire."
  },
  {
    question: "Puis-je importer mes données existantes ?",
    answer: "Oui ! NECTFORMA permet l'import de données via fichiers Excel : utilisateurs, formations, emplois du temps. Notre équipe peut également vous accompagner pour migrer vos données existantes vers la plateforme."
  },
  {
    question: "La plateforme est-elle conforme au RGPD ?",
    answer: "Absolument. NECTFORMA est conçu dans le respect du RGPD. Vos données sont hébergées en France, sécurisées et chiffrées. Vous gardez le contrôle total sur les données de votre établissement."
  },
  {
    question: "Quel support technique est disponible ?",
    answer: "Notre équipe support est disponible par email et via le chat en direct pendant les heures ouvrables. Nous proposons également une documentation complète, des tutoriels vidéo et des webinaires de formation pour vous aider à maîtriser la plateforme."
  },
  {
    question: "Combien d'utilisateurs puis-je ajouter ?",
    answer: "Il n'y a pas de limite sur le nombre d'utilisateurs. Vous pouvez ajouter autant d'apprenants, formateurs et administrateurs que nécessaire. Notre plateforme s'adapte à la croissance de votre établissement."
  },
  {
    question: "Puis-je personnaliser l'interface avec mon logo ?",
    answer: "Oui, vous pouvez personnaliser votre espace avec le logo de votre établissement, vos couleurs et vos informations. Les documents générés (feuilles d'émargement, exports PDF) affichent automatiquement votre identité visuelle."
  }
];

const FAQSection = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <HelpCircle className="h-4 w-4 text-primary mr-2" />
            <span className="text-primary font-medium">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Questions <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">fréquentes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Retrouvez les réponses aux questions les plus courantes sur NECTFORMA
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas trouvé la réponse à votre question ?
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            Contactez-nous
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
