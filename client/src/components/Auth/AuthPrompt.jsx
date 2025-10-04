import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SignInButton } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const AuthPrompt = ({ 
  children, 
  requireAuth = false, 
  showPrompt = true, 
  promptMessage = "Please sign in to continue",
  className = "",
  ...props 
}) => {
  const { isSignedIn } = useAuth();

  const handleClick = (e) => {
    if (requireAuth && !isSignedIn) {
      e.preventDefault();
      e.stopPropagation();
      
      if (showPrompt) {
        toast.error(promptMessage);
      }
      return false;
    }
  };

  if (requireAuth && !isSignedIn) {
    return (
      <SignInButton mode="modal">
        <div 
          onClick={handleClick}
          className={`cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </div>
      </SignInButton>
    );
  }

  return <div className={className} {...props}>{children}</div>;
};

export default AuthPrompt;
