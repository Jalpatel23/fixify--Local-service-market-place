import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/browse',
  '/jobs/',
  '/auth',
];

// Define restricted routes that require authentication
const RESTRICTED_ROUTES = [
  '/post-job',
  '/dashboard',
  '/my-jobs',
  '/saved-jobs',
  '/profile',
  '/messages',
  '/admin',
];

const AuthGuard = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run the effect if auth is loaded
    if (!isLoaded) return;

    const currentPath = location.pathname;
    
    // Check if current route is restricted
    const isRestrictedRoute = RESTRICTED_ROUTES.some(route => {
      if (route.endsWith('/')) {
        return currentPath.startsWith(route);
      }
      return currentPath === route || currentPath.startsWith(route + '/');
    });

    // If user is not signed in and trying to access a restricted route
    if (!isSignedIn && isRestrictedRoute) {
      // Redirect to 404 page
      navigate('/404', { replace: true });
    }
  }, [isLoaded, isSignedIn, location.pathname, navigate]);

  // Don't render children until auth is loaded
  if (!isLoaded) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
