import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.auth.getNotifications(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000 // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notification-count'],
    queryFn: () => api.auth.getUnreadNotificationCount(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000 // Refetch every 10 seconds
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: (id) => api.auth.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    }
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => api.auth.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      toast.success('All notifications marked as read');
    }
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => api.auth.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      toast.success('Notification deleted');
    }
  });

  // Show notification toast
  const showNotification = (notification) => {
    const icon = getNotificationIcon(notification.type, notification.priority);
    const style = getNotificationStyle(notification.type, notification.priority);

    toast.custom(
      (t) => (
        <div className={`${style} p-4 rounded-lg shadow-lg max-w-sm w-full`}>
          <div className="flex items-start gap-3">
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-right'
      }
    );
  };

  // Utility functions
  const getNotificationIcon = (type, priority) => {
    if (priority === 'high') return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (type === 'urgent') return <AlertCircle className="h-5 w-5 text-orange-500" />;
    if (type === 'job') return <Bell className="h-5 w-5 text-blue-500" />;
    if (type === 'message') return <Bell className="h-5 w-5 text-green-500" />;
    if (type === 'review') return <Bell className="h-5 w-5 text-yellow-500" />;
    return <Info className="h-5 w-5 text-gray-500" />;
  };

  const getNotificationStyle = (type, priority) => {
    if (priority === 'high') return 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20';
    if (type === 'urgent') return 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
    return 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    showNotification,
    getNotificationIcon,
    getNotificationStyle,
    formatTimeAgo,
    isMarkingRead: markReadMutation.isLoading,
    isMarkingAllRead: markAllReadMutation.isLoading,
    isDeleting: deleteNotificationMutation.isLoading
  };
}; 