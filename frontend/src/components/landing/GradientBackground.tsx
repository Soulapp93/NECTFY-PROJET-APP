import React from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'mesh' | 'orbs' | 'aurora' | 'gradient';
  className?: string;
  animate?: boolean;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'orbs',
  className = '',
  animate = true
}) => {
  const backgrounds = {
    mesh: (
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute inset-0 opacity-30 ${animate ? 'animate-[gradient-shift_15s_ease-in-out_infinite]' : ''}`}
          style={{
            background: `
              radial-gradient(at 40% 20%, hsl(var(--primary)) 0px, transparent 50%),
              radial-gradient(at 80% 0%, hsl(var(--accent)) 0px, transparent 50%),
              radial-gradient(at 0% 50%, hsl(var(--primary) / 0.5) 0px, transparent 50%),
              radial-gradient(at 80% 50%, hsl(var(--accent) / 0.5) 0px, transparent 50%),
              radial-gradient(at 0% 100%, hsl(var(--primary)) 0px, transparent 50%),
              radial-gradient(at 80% 100%, hsl(var(--accent)) 0px, transparent 50%)
            `
          }}
        />
      </div>
    ),
    orbs: (
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl ${animate ? 'animate-[float_8s_ease-in-out_infinite]' : ''}`}
        />
        <div 
          className={`absolute top-[50%] left-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-3xl ${animate ? 'animate-[float_10s_ease-in-out_infinite_1s]' : ''}`}
        />
        <div 
          className={`absolute bottom-[-10%] right-[20%] w-80 h-80 bg-primary/10 rounded-full blur-3xl ${animate ? 'animate-[float_12s_ease-in-out_infinite_2s]' : ''}`}
        />
      </div>
    ),
    aurora: (
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className={`absolute inset-0 ${animate ? 'animate-[aurora_20s_ease-in-out_infinite]' : ''}`}
          style={{
            background: `
              linear-gradient(
                135deg,
                transparent 0%,
                hsl(var(--primary) / 0.1) 20%,
                transparent 40%,
                hsl(var(--accent) / 0.1) 60%,
                transparent 80%,
                hsl(var(--primary) / 0.1) 100%
              )
            `,
            backgroundSize: '400% 400%'
          }}
        />
      </div>
    ),
    gradient: (
      <div className="absolute inset-0">
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 ${animate ? 'animate-[gradient-shift_10s_ease-in-out_infinite]' : ''}`}
        />
      </div>
    )
  };

  return (
    <div className={`relative ${className}`}>
      {backgrounds[variant]}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GradientBackground;
