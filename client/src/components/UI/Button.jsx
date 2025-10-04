import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300',
    outline: 'border border-secondary-300 bg-transparent hover:bg-secondary-50 active:bg-secondary-100',
    ghost: 'hover:bg-secondary-100 active:bg-secondary-200',
    success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 active:bg-warning-800',
    error: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800',
    link: 'text-primary-600 underline-offset-4 hover:underline',
  };
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
export { Button }; 