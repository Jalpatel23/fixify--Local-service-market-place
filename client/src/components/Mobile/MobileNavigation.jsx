import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  Home, 
  Search, 
  Plus, 
  User, 
  Bell,
  Menu,
  X,
  MapPin,
  Bookmark,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { useNotifications } from '../../hooks/useNotifications';

const MobileNavigation = () => {
  const { isSignedIn, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { unreadCount } = useNotifications();

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigationItems = [
    {
      name: 'Home',
      icon: Home,
      path: '/',
      badge: null
    },
    {
      name: 'Browse',
      icon: Search,
      path: '/browse',
      badge: null
    },
    {
      name: 'Post Job',
      icon: Plus,
      path: '/post-job',
      badge: null
    },
    {
      name: 'Notifications',
      icon: Bell,
      path: '/notifications',
      badge: unreadCount || null
    },
    {
      name: 'Profile',
      icon: User,
      path: '/profile',
      badge: null
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center w-full py-2 px-1 rounded-lg transition-colors ${
                  active 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="error" 
                      size="sm" 
                      className="absolute -top-2 -right-2 min-w-[18px] h-[18px] text-xs"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Menu
                </h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 p-4 space-y-2">
                {/* Online Status */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavigation('/dashboard')}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Dashboard</span>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation('/messages')}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <Bell className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Messages</span>
                  </button>
                  
                  <button
                    onClick={() => handleNavigation('/saved-jobs')}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <Bookmark className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Saved Jobs</span>
                  </button>
                </div>

                {/* Settings */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleNavigation('/settings')}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                  >
                    <Settings className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">Settings</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {isSignedIn ? (
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleNavigation('/auth')}
                    className="w-full"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar with Menu Button */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fixify
            </h1>
          </div>
          
          {/* Online Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="pb-20 md:pb-0" />
    </>
  );
};

export default MobileNavigation; 