import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Star, 
  BarChart3, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../UI/Card';
import Button from '../UI/Button';

const AdminLayout = ({ children, activeSection = 'dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: activeSection === 'dashboard'
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: activeSection === 'users'
    },
    {
      name: 'Job Moderation',
      href: '/admin/jobs',
      icon: Briefcase,
      current: activeSection === 'jobs'
    },
    {
      name: 'Review Moderation',
      href: '/admin/reviews',
      icon: Star,
      current: activeSection === 'reviews'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: activeSection === 'analytics'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: activeSection === 'settings'
    }
  ];

  // Check if user has admin privileges
  if (!user?.isAdmin && !user?.isModerator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <Card className="max-w-md w-full">
          <Card.Content className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              Access Denied
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              You don't have permission to access the admin panel.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-secondary-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-secondary-200 dark:border-secondary-700">
          <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
            Admin Panel
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:text-secondary-100 dark:hover:bg-secondary-700'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              );
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center mr-3">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.firstName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-secondary-600 dark:text-secondary-400 text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {user?.isAdmin ? 'Administrator' : 'Moderator'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Welcome back, {user?.firstName}!
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 