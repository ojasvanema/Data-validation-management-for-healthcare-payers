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
        bg-[#0a0a0a]/80
        backdrop-blur-md
        border border-white/5
        rounded-2xl 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] 
        text-white 
        relative
        overflow-hidden
        transition-all duration-300
        ${hoverEffect ? 'hover:bg-[#0a0a0a]/90 hover:border-emerald-500/20 hover:shadow-[0_8px_40px_0_rgba(16,185,129,0.1)] hover:scale-[1.01]' : ''}
        ${className}
      `}
    >
      {/* Subtle top gloss */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>
      {children}
    </div>
  );
};

export default GlassCard;
