import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300 backdrop-blur-md
        
        bg-white border-slate-200 shadow-sm text-slate-800
        dark:bg-[#0a0a0a]/80 dark:border-white/5 dark:text-white dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
        
        border
        
        ${hoverEffect || onClick ?
          'cursor-pointer hover:shadow-lg dark:hover:bg-[#0a0a0a]/90 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 dark:hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] hover:scale-[1.01]'
          : ''}
        
        ${className}
      `}
    >
      {/* Subtle top gloss - Dark mode only */}
      <div className="hidden dark:block absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50"></div>

      {children}
    </div>
  );
};

export default GlassCard;
