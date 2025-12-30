import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'fade' | 'blur' | 'slide-up';
  delay?: number;
  duration?: number;
  stagger?: boolean;
  staggerDelay?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  stagger = false,
  staggerDelay = 100
}) => {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.1,
    triggerOnce: true
  });

  const getAnimationClasses = () => {
    const baseClasses = `transition-all ease-out`;
    
    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return `${baseClasses} opacity-0 translate-y-12`;
        case 'fade-left':
          return `${baseClasses} opacity-0 -translate-x-12`;
        case 'fade-right':
          return `${baseClasses} opacity-0 translate-x-12`;
        case 'scale':
          return `${baseClasses} opacity-0 scale-90`;
        case 'blur':
          return `${baseClasses} opacity-0 blur-sm scale-95`;
        case 'slide-up':
          return `${baseClasses} opacity-0 translate-y-16`;
        case 'fade':
        default:
          return `${baseClasses} opacity-0`;
      }
    }
    
    return `${baseClasses} opacity-100 translate-x-0 translate-y-0 scale-100 blur-0`;
  };

  // Handle staggered children if enabled
  if (stagger && React.Children.count(children) > 1) {
    return (
      <div ref={ref} className={className}>
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className={getAnimationClasses()}
            style={{ 
              transitionDuration: `${duration}ms`,
              transitionDelay: `${delay + index * staggerDelay}ms` 
            }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      style={{ 
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms` 
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
