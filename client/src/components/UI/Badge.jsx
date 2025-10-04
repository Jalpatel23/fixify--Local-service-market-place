import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variantClasses = {
    default: 'border-transparent bg-primary-100 text-primary-900 hover:bg-primary-200',
    secondary: 'border-transparent bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
    success: 'border-transparent bg-success-100 text-success-900 hover:bg-success-200',
    warning: 'border-transparent bg-warning-100 text-warning-900 hover:bg-warning-200',
    error: 'border-transparent bg-error-100 text-error-900 hover:bg-error-200',
    outline: 'text-secondary-600',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
export { Badge }; 