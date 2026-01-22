import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-amber-500 text-black hover:bg-amber-400 focus:ring-amber-500 shadow-md font-bold", // High Vis Amber with Black Text
    secondary: "bg-black text-white hover:bg-zinc-900 focus:ring-zinc-800 border border-zinc-800", // Pure Black with Zinc border
    outline: "border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-amber-50 dark:hover:bg-zinc-800 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-500 focus:ring-amber-500 bg-white dark:bg-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};