import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary',
  className = '',
  text = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variantClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} ${variantClasses[variant]} animate-spin rounded-full border-2 border-current border-t-transparent`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">{text}</span>
      </div>
      {text && (
        <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
export { LoadingSpinner }; 