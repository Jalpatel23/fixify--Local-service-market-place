import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, X, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../UI/Badge';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch recent notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: () => api.auth.getNotifications({ limit: 5 }),
    staleTime: 30 * 1000 // 30 seconds
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      job: '💼',
      message: '💬',
      review: '⭐',
      system: 'ℹ️',
      urgent: '🚨'
    };
    return icons[type] || 'ℹ️';
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <Badge 
            variant="error" 
            size="sm" 
            className="absolute -top-1 -right-1 min-w-[18px] h-4 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Notifications
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : notifications?.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              <div className="space-y-1">
                {notifications?.slice(0, 5).map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatTimeAgo(notification.createdAt)}
                          {!notification.read && (
                            <Badge variant="blue" size="xs">New</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications?.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notification center
                  window.location.href = '/notifications';
                }}
              >
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell; 