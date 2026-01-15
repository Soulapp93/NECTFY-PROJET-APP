import React from 'react';
import { Link } from 'react-router-dom';

interface AnimatedButtonProps {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  to,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  icon
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: `
      relative overflow-hidden
      bg-gradient-to-r from-primary to-accent text-primary-foreground
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-accent before:to-primary
      before:opacity-0 before:transition-opacity before:duration-500
      hover:before:opacity-100
      hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
      hover:scale-105 active:scale-95
    `,
    secondary: `
      relative overflow-hidden
      bg-secondary text-secondary-foreground
      before:absolute before:inset-0 before:bg-primary/10
      before:translate-x-[-100%] before:transition-transform before:duration-500
      hover:before:translate-x-0
      hover:shadow-lg active:scale-95
    `,
    outline: `
      relative overflow-hidden
      border-2 border-border text-foreground
      before:absolute before:inset-0 before:bg-primary/5
      before:scale-x-0 before:transition-transform before:duration-300 before:origin-left
      hover:before:scale-x-100
      hover:border-primary hover:text-primary
      active:scale-95
    `
  };

  const baseClasses = `
    group relative inline-flex items-center justify-center
    font-semibold rounded-xl
    transition-all duration-300 ease-out
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  const content = (
    <>
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon && (
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            {icon}
          </span>
        )}
      </span>
      
      {/* Shine effect */}
      <span className="absolute inset-0 z-0 overflow-hidden rounded-xl">
        <span className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:animate-[shine_0.75s_ease-out]" />
      </span>
    </>
  );

  if (to) {
    return <Link to={to} className={baseClasses}>{content}</Link>;
  }

  if (href) {
    return <a href={href} className={baseClasses}>{content}</a>;
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
};

export default AnimatedButton;
