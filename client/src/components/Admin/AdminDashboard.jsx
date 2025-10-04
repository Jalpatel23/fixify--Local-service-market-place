import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Briefcase, 
  MessageCircle, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar
} from 'lucide-react';
import { apiService } from '../../services/api';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => apiService.admin.getDashboardStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

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
        icon={<Activity className="h-12 w-12" />}
        title="Error loading dashboard"
        description="There was an error loading the admin dashboard. Please try again."
      />
    );
  }

  const { overview, recentJobs, userGrowth, jobStatsByCategory } = stats?.data || {};

  const statCards = [
    {
      title: 'Total Users',
      value: overview?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Total Jobs',
      value: overview?.totalJobs || 0,
      icon: Briefcase,
      color: 'green',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Total Reviews',
      value: overview?.totalReviews || 0,
      icon: Star,
      color: 'yellow',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Active Users',
      value: overview?.activeUsers || 0,
      icon: Users,
      color: 'purple',
      change: '+5%',
      trend: 'up'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Overview of system statistics and recent activity
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <Card.Content className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-secondary-500 ml-1">from last month</span>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Recent Jobs */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Jobs</Card.Title>
          <Card.Description>
            Latest job postings in the system
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {recentJobs?.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job._id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                      {job.title}
                    </h4>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      by {job.creator?.firstName} {job.creator?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.status === 'completed' ? 'bg-green-100 text-green-800' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-secondary-100 text-secondary-800'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-sm text-secondary-500">
                      ${job.budget?.min}-${job.budget?.max}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-center py-4">
              No recent jobs found
            </p>
          )}
        </Card.Content>
      </Card>

      {/* Job Categories */}
      <Card>
        <Card.Header>
          <Card.Title>Jobs by Category</Card.Title>
          <Card.Description>
            Distribution of jobs across different categories
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {jobStatsByCategory?.length > 0 ? (
            <div className="space-y-3">
              {jobStatsByCategory.map((category) => (
                <div key={category._id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-secondary-900 dark:text-secondary-100 capitalize">
                      {category._id}
                    </h4>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      {category.completed} completed out of {category.count} total
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                      {category.count}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {Math.round((category.completed / category.count) * 100)}% completion
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-secondary-500 text-center py-4">
              No job category data available
            </p>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default AdminDashboard; 