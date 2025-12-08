import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div 
      className={`
        bg-glass-100 
        backdrop-blur-xl 
        border border-glass-border 
        rounded-2xl 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] 
        text-white 
        transition-all duration-300
        ${hoverEffect ? 'hover:bg-glass-200 hover:scale-[1.01] hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.45)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
