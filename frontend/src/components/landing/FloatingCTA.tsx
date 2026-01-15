import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Sparkles } from 'lucide-react';

const FloatingCTA = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 500;
      setShowScrollTop(scrolled);
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="w-12 h-12 bg-muted hover:bg-muted/80 text-foreground rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 animate-fade-in"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
      
      {/* Floating CTA */}
      <Link
        to="/create-establishment"
        className="group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-fade-in"
      >
        <Sparkles className="h-5 w-5" />
        <span className="font-semibold hidden sm:inline">Essai gratuit</span>
      </Link>
    </div>
  );
};

export default FloatingCTA;
