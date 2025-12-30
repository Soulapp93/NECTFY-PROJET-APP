import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickResponses = [
    "Comment créer un compte ?",
    "Tarifs et plans",
    "Démonstration",
    "Support technique"
  ];

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('compte') || message.includes('créer') || message.includes('inscription')) {
      return "Pour créer un compte, cliquez sur 'Créer un compte' en haut de la page. L'inscription est gratuite et vous donne accès à un essai de 14 jours. Vous pourrez gérer votre établissement, vos formations et vos utilisateurs !";
    }
    if (message.includes('tarif') || message.includes('prix') || message.includes('plan') || message.includes('coût')) {
      return "Nos tarifs sont adaptés à la taille de votre établissement. Contactez-nous via le formulaire de contact pour obtenir un devis personnalisé. L'essai de 14 jours est gratuit !";
    }
    if (message.includes('démo') || message.includes('démonstration') || message.includes('présentation')) {
      return "Excellente idée ! Vous pouvez demander une démonstration personnalisée via notre formulaire de contact. Notre équipe vous recontactera rapidement pour planifier une session.";
    }
    if (message.includes('support') || message.includes('aide') || message.includes('problème')) {
      return "Notre équipe support est disponible par email à contact@nectfy.com. Pour une réponse rapide, utilisez le formulaire de contact avec le sujet 'Support technique'.";
    }
    if (message.includes('fonctionnalité') || message.includes('module')) {
      return "NECTFY propose 12 modules complets : Tableau de bord, Administration, Gestion des utilisateurs, Formations, Cahiers de textes, Emplois du temps, Émargements, Messagerie, Groupes, et plus encore !";
    }
    if (message.includes('émargement') || message.includes('signature') || message.includes('présence')) {
      return "Notre système d'émargement numérique permet de générer des feuilles automatiquement, de collecter des signatures électroniques via QR code, et de suivre les présences en temps réel. Tout est conforme aux réglementations !";
    }
    
    return "Merci pour votre message ! Pour toute question spécifique, n'hésitez pas à nous contacter via le formulaire en bas de page ou par email à contact@nectfy.com. Notre équipe vous répondra rapidement.";
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickResponse = (response: string) => {
    setInputValue(response);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
          isOpen 
            ? 'bg-muted text-foreground' 
            : 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
        }`}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Assistant NECTFY</h3>
                <p className="text-xs text-primary-foreground/80">En ligne • Répond instantanément</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    message.isBot
                      ? 'bg-muted text-foreground rounded-tl-none'
                      : 'bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-tr-none'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-2 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Responses */}
          <div className="px-4 py-2 bg-muted/30 border-t border-border flex gap-2 overflow-x-auto">
            {quickResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => handleQuickResponse(response)}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs whitespace-nowrap hover:bg-primary/20 transition-colors"
              >
                {response}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-card border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
