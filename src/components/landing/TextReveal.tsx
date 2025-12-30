import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface TextRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

const TextReveal: React.FC<TextRevealProps> = ({
  children,
  className = '',
  delay = 0,
  staggerDelay = 50
}) => {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.2,
    triggerOnce: true
  });

  // Convert children to string if it's just text
  const text = typeof children === 'string' ? children : null;
  
  if (text) {
    const words = text.split(' ');
    
    return (
      <div ref={ref} className={`overflow-hidden ${className}`}>
        <div className="flex flex-wrap">
          {words.map((word, index) => (
            <span
              key={index}
              className="inline-block overflow-hidden mr-[0.25em]"
            >
              <span
                className={`inline-block transition-all duration-700 ease-out ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-full opacity-0'
                }`}
                style={{ 
                  transitionDelay: `${delay + index * staggerDelay}ms` 
                }}
              >
                {word}
              </span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  // For non-text children, just animate as a block
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <div
        className={`transition-all duration-700 ease-out ${
          isVisible 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0'
        }`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </div>
  );
};

export default TextReveal;
