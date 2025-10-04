import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Bell, 
  BellOff, 
  Mail, 
  Smartphone,
  Clock,
  Save,
  Check,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { LoadingSpinner } from '../UI/LoadingSpinner';

const NotificationPreferences = () => {
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
  const queryClient = useQueryClient();

  // Fetch notification preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.auth.getNotificationPreferences(),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data) => api.auth.updateNotificationPreferences(data),
    onSuccess: () => {
      toast.success('Notification preferences updated successfully');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    }
  });

  useEffect(() => {
    if (preferences) {
      setSettings(preferences);
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferencesMutation.mutate(settings);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleQuietHoursToggle = () => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled
      }
    }));
  };

  const handleTimeChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Notification Preferences
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize how and when you receive notifications
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updatePreferencesMutation.isLoading}
          className="flex items-center gap-2"
        >
          {updatePreferencesMutation.isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </Button>
      </div>

      {/* Notification Channels */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Bell size={20} />
            Notification Channels
          </Card.Title>
          <Card.Description>
            Choose how you want to receive notifications
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {[
              {
                key: 'email',
                label: 'Email Notifications',
                description: 'Receive notifications via email',
                icon: Mail,
                enabled: settings.email
              },
              {
                key: 'push',
                label: 'Push Notifications',
                description: 'Receive notifications in your browser',
                icon: Bell,
                enabled: settings.push
              },
              {
                key: 'sms',
                label: 'SMS Notifications',
                description: 'Receive notifications via text message',
                icon: Smartphone,
                enabled: settings.sms
              }
            ].map((channel) => (
              <div key={channel.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <channel.icon size={20} className="text-gray-600 dark:text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {channel.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {channel.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {channel.enabled && (
                    <Badge variant="success" size="sm">Active</Badge>
                  )}
                  <input
                    type="checkbox"
                    checked={channel.enabled}
                    onChange={() => handleToggle(channel.key)}
                    className="rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Notification Types */}
      <Card>
        <Card.Header>
          <Card.Title>Notification Types</Card.Title>
          <Card.Description>
            Choose which types of notifications you want to receive
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {[
              {
                key: 'jobAlerts',
                label: 'Job Alerts',
                description: 'New job postings and updates',
                icon: '💼'
              },
              {
                key: 'messageAlerts',
                label: 'Message Alerts',
                description: 'New messages and conversations',
                icon: '💬'
              },
              {
                key: 'reviewAlerts',
                label: 'Review Alerts',
                description: 'New reviews and ratings',
                icon: '⭐'
              },
              {
                key: 'systemAlerts',
                label: 'System Alerts',
                description: 'Important system notifications',
                icon: 'ℹ️'
              },
              {
                key: 'marketingAlerts',
                label: 'Marketing Alerts',
                description: 'Promotional content and offers',
                icon: '📢'
              }
            ].map((type) => (
              <div key={type.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{type.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {type.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {settings[type.key] && (
                    <Badge variant="success" size="sm">Enabled</Badge>
                  )}
                  <input
                    type="checkbox"
                    checked={settings[type.key]}
                    onChange={() => handleToggle(type.key)}
                    className="rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Clock size={20} />
            Quiet Hours
          </Card.Title>
          <Card.Description>
            Pause notifications during specific hours
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Enable Quiet Hours
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pause notifications during specific hours
                </p>
              </div>
              <div className="flex items-center gap-2">
                {settings.quietHours.enabled && (
                  <Badge variant="success" size="sm">Active</Badge>
                )}
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={handleQuietHoursToggle}
                  className="rounded"
                />
              </div>
            </div>

            {settings.quietHours.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Summary */}
      <Card>
        <Card.Header>
          <Card.Title>Notification Summary</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Bell className="mx-auto h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                {Object.values(settings).filter(v => typeof v === 'boolean' && v).length} Active
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Notification channels
              </p>
            </div>
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                {settings.quietHours.enabled ? 'Enabled' : 'Disabled'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quiet hours
              </p>
            </div>
            <div className="text-center">
              <Check className="mx-auto h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">
                Real-time
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Instant delivery
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default NotificationPreferences; 