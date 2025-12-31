import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-sans font-bold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-dm-crimson text-white hover:bg-red-700 shadow-md",
    secondary: "bg-dm-dark text-white hover:bg-gray-700",
    outline: "border-2 border-dm-light text-dm-dark hover:border-dm-dark hover:text-dm-dark bg-transparent",
    ghost: "bg-transparent text-dm-light hover:text-dm-crimson"
  };

  const sizes = {
    sm: "px-3 py-1 text-sm rounded-md",
    md: "px-6 py-2 text-base rounded-md",
    lg: "px-8 py-3 text-lg rounded-lg",
    icon: "p-2 rounded-full"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin mr-2">⟳</span>
      ) : null}
      {children}
    </button>
  );
};