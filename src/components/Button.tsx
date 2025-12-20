import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-md";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-indigo-600 shadow-indigo-200",
    secondary: "bg-secondary text-white hover:bg-amber-500 shadow-amber-200",
    accent: "bg-accent text-white hover:bg-pink-600 shadow-pink-200",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-200",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-green-200",
    outline: "border-2 border-slate-300 text-slate-600 hover:bg-slate-50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      ) : children}
    </button>
  );
};