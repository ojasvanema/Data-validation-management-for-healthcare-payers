import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-transparent",
    secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10",
    outline: "bg-transparent border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400",
    ghost: "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;