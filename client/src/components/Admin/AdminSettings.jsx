import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Shield, 
  Users, 
  Briefcase,
  DollarSign,
  Bell,
  Globe,
  Database,
  Key,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Card } from '../UI/Card';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { Modal } from '../UI/Modal';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.admin.getSettings(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data) => api.admin.updateSettings(data),
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  const handleSaveSettings = (section, data) => {
    updateSettingsMutation.mutate({ section, data });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Globe }
  ];

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error Loading Settings
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.response?.data?.message || 'Failed to load settings'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system configuration and platform settings
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <Card.Content className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon size={16} className="mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </Card.Content>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card>
              <Card.Header>
                <Card.Title>{tabs.find(tab => tab.id === activeTab)?.label} Settings</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-gray-600 dark:text-gray-400">
                  Settings for {activeTab} will be implemented here.
                </p>
              </Card.Content>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings; 