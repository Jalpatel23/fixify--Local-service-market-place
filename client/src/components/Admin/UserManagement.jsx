import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Shield,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import { apiService } from '../../services/api';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Input from '../UI/Input';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    page: 1
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminUsers', filters],
    queryFn: () => apiService.admin.getUsers(filters),
    placeholderData: (prev) => prev,
    staleTime: 30000
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => apiService.admin.updateUserStatus(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleUserAction = (userId, action, value) => {
    updateUserMutation.mutate({
      userId,
      data: { [action]: value }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Error loading users"
        description="There was an error loading the user list. Please try again."
      />
    );
  }

  const { data: users, pagination } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          User Management
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Manage user accounts, permissions, and status
        </p>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                showClearButton
              />
            </div>
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-100"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:border-secondary-600 dark:text-secondary-100"
              >
                <option value="">All Roles</option>
                <option value="client">Client</option>
                <option value="helper">Helper</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => setFilters({ search: '', status: '', role: '', page: 1 })}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Users List */}
      <Card>
        <Card.Header>
          <Card.Title>Users ({pagination?.total || 0})</Card.Title>
          <Card.Description>
            Showing {users?.length || 0} of {pagination?.total || 0} users
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {users?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200 dark:border-secondary-700">
                    <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">
                      Permissions
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">
                      Joined
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-secondary-900 dark:text-secondary-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-secondary-100 dark:border-secondary-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center mr-3">
                            {user.profileImage ? (
                              <img 
                                src={user.profileImage} 
                                alt={user.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-secondary-600 dark:text-secondary-400 font-medium">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900 dark:text-secondary-100">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                          user.accountType === 'client' ? 'bg-blue-100 text-blue-800' :
                          user.accountType === 'helper' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.accountType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {user.isAdmin && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                          {user.isModerator && (
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.adminPermissions?.map((permission) => (
                            <span key={permission} className="px-2 py-1 text-xs bg-secondary-100 text-secondary-700 rounded">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-secondary-600 dark:text-secondary-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant={user.isActive ? "outline" : "primary"}
                            onClick={() => handleUserAction(user.clerkId, 'isActive', !user.isActive)}
                          >
                            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant={user.isAdmin ? "outline" : "primary"}
                            onClick={() => handleUserAction(user.clerkId, 'isAdmin', !user.isAdmin)}
                          >
                            {user.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No users found"
              description="No users match the current filters."
            />
          )}
        </Card.Content>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-secondary-600 dark:text-secondary-400">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 