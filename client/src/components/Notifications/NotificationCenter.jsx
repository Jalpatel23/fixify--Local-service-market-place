import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Bell, 
  BellOff, 
  Settings, 
  Check, 
  X, 
  Trash2,
  Filter,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Star,
  MessageSquare,
  Briefcase,
  User
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { Modal } from '../UI/Modal';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { EmptyState } from '../UI/EmptyState';

const NotificationCenter = () => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isMuted, setIsMuted] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications', { search: searchQuery, filter: filterType }],
    queryFn: () => api.auth.getNotifications({ search: searchQuery, type: filterType }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000 // Refetch every 30 seconds
  });

  // Fetch notification preferences
  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.auth.getNotificationPreferences(),
    staleTime: 5 * 60 * 1000 // 5 minutes
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
      toast.success('Notification deleted');
    }
  });

  // Update notification preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => api.auth.updateNotificationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated');
      setShowPreferences(false);
    }
  });

  // Toggle mute
  const toggleMuteMutation = useMutation({
    mutationFn: (muted) => api.auth.updateNotificationPreferences({ muted }),
    onSuccess: () => {
      setIsMuted(!isMuted);
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted');
    }
  });

  const notificationTypes = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'job', label: 'Jobs', icon: Briefcase },
    { id: 'message', label: 'Messages', icon: MessageSquare },
    { id: 'review', label: 'Reviews', icon: Star },
    { id: 'system', label: 'System', icon: Info },
    { id: 'urgent', label: 'Urgent', icon: AlertCircle }
  ];

  const getNotificationIcon = (type) => {
    const icons = {
      job: Briefcase,
      message: MessageSquare,
      review: Star,
      system: Info,
      urgent: AlertCircle,
      verification: CheckCircle,
      payment: User
    };
    return icons[type] || Info;
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'text-red-600';
    if (type === 'urgent') return 'text-orange-600';
    if (type === 'job') return 'text-blue-600';
    if (type === 'message') return 'text-green-600';
    if (type === 'review') return 'text-yellow-600';
    return 'text-gray-600';
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

  const handleMarkRead = (id) => {
    markReadMutation.mutate(id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <Badge 
                variant="error" 
                size="sm" 
                className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleMuteMutation.mutate(!isMuted)}
            className="flex items-center gap-2"
          >
            {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreferences(true)}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            Preferences
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2"
          >
            <Clock size={16} />
            History
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
        <div className="flex gap-2">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={filterType === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type.id)}
                className="flex items-center gap-2"
              >
                <Icon size={14} />
                {type.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {unreadCount > 0 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isLoading}
          >
            {markAllReadMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Marking...
              </>
            ) : (
              <>
                <Check size={16} />
                Mark all as read
              </>
            )}
          </Button>
        </div>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Error loading notifications</div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : filteredNotifications?.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="No Notifications"
          description={searchQuery || filterType !== 'all' 
            ? "No notifications match your current filters." 
            : "You're all caught up! No new notifications."
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications?.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColor = getNotificationColor(notification.type, notification.priority);
            
            return (
              <Card key={notification._id} className={`${!notification.read ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                <Card.Content className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${iconColor}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.priority === 'high' && (
                              <Badge variant="error" size="xs">High Priority</Badge>
                            )}
                            {notification.type && (
                              <Badge variant="secondary" size="xs">
                                {notification.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkRead(notification._id)}
                              disabled={markReadMutation.isLoading}
                            >
                              <Check size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification._id)}
                            disabled={deleteNotificationMutation.isLoading}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal 
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        preferences={preferences}
        onUpdate={updatePreferencesMutation.mutate}
        isLoading={updatePreferencesMutation.isLoading}
      />

      {/* Notification History Modal */}
      <NotificationHistoryModal 
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
};

// Notification Preferences Modal Component
const NotificationPreferencesModal = ({ isOpen, onClose, preferences, onUpdate, isLoading }) => {
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    sms: false,
    jobAlerts: true,
    messageAlerts: true,
    reviewAlerts: true,
    systemAlerts: true,
    marketingAlerts: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const handleSave = () => {
    onUpdate(settings);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Preferences"
      size="lg"
    >
      <div className="space-y-6">
        {/* Channel Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Notification Channels
          </h3>
          <div className="space-y-3">
            {[
              { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
              { key: 'push', label: 'Push Notifications', description: 'Receive notifications in your browser' },
              { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via text message' }
            ].map((channel) => (
              <div key={channel.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{channel.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{channel.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[channel.key]}
                  onChange={(e) => setSettings(prev => ({ ...prev, [channel.key]: e.target.checked }))}
                  className="rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Type Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Notification Types
          </h3>
          <div className="space-y-3">
            {[
              { key: 'jobAlerts', label: 'Job Alerts', description: 'New job postings and updates' },
              { key: 'messageAlerts', label: 'Message Alerts', description: 'New messages and conversations' },
              { key: 'reviewAlerts', label: 'Review Alerts', description: 'New reviews and ratings' },
              { key: 'systemAlerts', label: 'System Alerts', description: 'Important system notifications' },
              { key: 'marketingAlerts', label: 'Marketing Alerts', description: 'Promotional content and offers' }
            ].map((type) => (
              <div key={type.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{type.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[type.key]}
                  onChange={(e) => setSettings(prev => ({ ...prev, [type.key]: e.target.checked }))}
                  className="rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quiet Hours
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Enable Quiet Hours</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pause notifications during specific hours</p>
              </div>
              <input
                type="checkbox"
                checked={settings.quietHours.enabled}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  quietHours: { ...prev.quietHours, enabled: e.target.checked }
                }))}
                className="rounded"
              />
            </div>
            {settings.quietHours.enabled && (
              <div className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      quietHours: { ...prev.quietHours, start: e.target.value }
                    }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      quietHours: { ...prev.quietHours, end: e.target.value }
                    }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Notification History Modal Component
const NotificationHistoryModal = ({ isOpen, onClose }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['notification-history'],
    queryFn: () => api.auth.getNotificationHistory(),
    enabled: isOpen
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification History"
      size="xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : history?.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title="No History"
            description="No notification history available."
          />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {history?.map((notification) => (
              <div key={notification._id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {notification.message}
                    </p>
                    <div className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NotificationCenter; 