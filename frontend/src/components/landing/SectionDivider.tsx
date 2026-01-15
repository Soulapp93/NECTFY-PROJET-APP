import React from 'react';

interface SectionDividerProps {
  variant?: 'wave' | 'curve' | 'angle' | 'dots';
  flip?: boolean;
  className?: string;
  fillColor?: string;
}

const SectionDivider: React.FC<SectionDividerProps> = ({
  variant = 'wave',
  flip = false,
  className = '',
  fillColor = 'fill-background'
}) => {
  const transforms = flip ? 'rotate-180' : '';

  const dividers = {
    wave: (
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={`w-full h-12 md:h-20 ${transforms} ${fillColor}`}
      >
        <path d="M0,40 C360,100 720,0 1080,50 C1260,75 1380,40 1440,40 L1440,100 L0,100 Z" />
      </svg>
    ),
    curve: (
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={`w-full h-12 md:h-20 ${transforms} ${fillColor}`}
      >
        <path d="M0,60 Q720,120 1440,60 L1440,100 L0,100 Z" />
      </svg>
    ),
    angle: (
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={`w-full h-12 md:h-20 ${transforms} ${fillColor}`}
      >
        <polygon points="0,100 1440,0 1440,100" />
      </svg>
    ),
    dots: (
      <div className={`flex justify-center gap-2 py-8 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '450ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '600ms' }} />
      </div>
    )
  };

  if (variant === 'dots') {
    return dividers.dots;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {dividers[variant]}
    </div>
  );
};

export default SectionDivider;
