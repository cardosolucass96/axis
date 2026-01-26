import React from 'react';
import { ds, cn } from '../styles/design-tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  className = '', 
  children, 
  ...props 
}) => {
  const sizeClasses = ds.button.sizes[size];
  
  const variants = {
    primary: ds.button.primary,
    secondary: ds.button.secondary,
    outline: ds.button.outline,
    ghost: ds.button.ghost,
    danger: ds.button.danger,
  };

  return (
    <button 
      className={cn(ds.button.base, sizeClasses, variants[variant], className)} 
      {...props}
    >
      {children}
    </button>
  );
};