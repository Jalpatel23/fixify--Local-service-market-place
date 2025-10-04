import React, { forwardRef } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  success,
  disabled = false,
  required = false,
  placeholder,
  value,
  onChange,
  onClear,
  className = '',
  fullWidth = false,
  leftIcon,
  rightIcon,
  showClearButton = false,
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [inputType, setInputType] = React.useState(type);
  
  React.useEffect(() => {
    if (type === 'password' && showPasswordToggle) {
      setInputType(showPassword ? 'text' : 'password');
    } else {
      setInputType(type);
    }
  }, [type, showPassword, showPasswordToggle]);
  
  const baseClasses = 'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-secondary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const stateClasses = {
    default: 'border-secondary-300',
    error: 'border-error-300 focus-visible:ring-error-500',
    success: 'border-success-300 focus-visible:ring-success-500',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const getStateClass = () => {
    if (error) return stateClasses.error;
    if (success) return stateClasses.success;
    return stateClasses.default;
  };
  
  const classes = [
    baseClasses,
    getStateClass(),
    widthClass,
    className,
  ].filter(Boolean).join(' ');
  
  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };
  
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
          {label}
          {required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={`${classes} ${leftIcon ? 'pl-10' : ''} ${rightIcon || showPasswordToggle || (showClearButton && value) ? 'pr-10' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {showClearButton && value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={togglePassword}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
          
          {rightIcon && !showPasswordToggle && !(showClearButton && value) && (
            <div className="text-secondary-400">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      
      {success && (
        <p className="text-sm text-success-600 dark:text-success-400">
          {success}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
export { Input }; 