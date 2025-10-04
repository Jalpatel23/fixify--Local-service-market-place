import React from 'react';
import { User } from 'lucide-react';

const Avatar = ({ 
  src, 
  alt, 
  fallback, 
  size = 'md', 
  className = '',
  onClick 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${sizeClass} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {fallback ? (
        <span className="font-medium text-gray-600 dark:text-gray-400">
          {fallback}
        </span>
      ) : (
        <User className="w-1/2 h-1/2 text-gray-400" />
      )}
    </div>
  );
};

export default Avatar;
