import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Star,
  MessageSquare,
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { StatsCard } from '../UI/StatsCard';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['admin', 'analytics', timeRange],
    queryFn: () => api.admin.getAnalytics({ timeRange }),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const renderMetricCard = (title, value, change, icon, color = 'blue') => {
    const isPositive = change >= 0;
    return (
      <StatsCard
        title={title}
        value={value}
        change={change}
        icon={icon}
        trend={isPositive ? 'up' : 'down'}
        color={color}
      />
    );
  };

  const renderChart = (title, data, type = 'bar') => {
    return (
      <Card>
        <Card.Header>
          <Card.Title>{title}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 mb-2" />
              <p>Chart visualization would be implemented here</p>
              <p className="text-sm">Using Chart.js or Recharts library</p>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error Loading Analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.response?.data?.message || 'Failed to load analytics data'}
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
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive system analytics and performance metrics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderMetricCard(
              'Total Users',
              formatNumber(analytics?.users?.total || 0),
              getPercentageChange(analytics?.users?.current, analytics?.users?.previous),
              Users,
              'blue'
            )}
            {renderMetricCard(
              'Active Jobs',
              formatNumber(analytics?.jobs?.active || 0),
              getPercentageChange(analytics?.jobs?.current, analytics?.jobs?.previous),
              Briefcase,
              'green'
            )}
            {renderMetricCard(
              'Total Revenue',
              formatCurrency(analytics?.revenue?.total || 0),
              getPercentageChange(analytics?.revenue?.current, analytics?.revenue?.previous),
              DollarSign,
              'purple'
            )}
            {renderMetricCard(
              'Avg Rating',
              (analytics?.ratings?.average || 0).toFixed(1),
              getPercentageChange(analytics?.ratings?.current, analytics?.ratings?.previous),
              Star,
              'yellow'
            )}
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Activity */}
            <Card>
              <Card.Header>
                <Card.Title>User Activity</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">New Users</span>
                    <span className="font-medium">{formatNumber(analytics?.users?.new || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                    <span className="font-medium">{formatNumber(analytics?.users?.active || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Verified Users</span>
                    <span className="font-medium">{formatNumber(analytics?.users?.verified || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Premium Users</span>
                    <span className="font-medium">{formatNumber(analytics?.users?.premium || 0)}</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Job Statistics */}
            <Card>
              <Card.Header>
                <Card.Title>Job Statistics</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Posted Jobs</span>
                    <span className="font-medium">{formatNumber(analytics?.jobs?.posted || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed Jobs</span>
                    <span className="font-medium">{formatNumber(analytics?.jobs?.completed || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cancelled Jobs</span>
                    <span className="font-medium">{formatNumber(analytics?.jobs?.cancelled || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Completion Time</span>
                    <span className="font-medium">{analytics?.jobs?.avgCompletionTime || '0'} days</span>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card>
            <Card.Header>
              <Card.Title>Revenue Breakdown</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(analytics?.revenue?.platformFees || 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Platform Fees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(analytics?.revenue?.subscriptions || 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Subscriptions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(analytics?.revenue?.premium || 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Premium Features</div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Top Categories */}
          <Card>
            <Card.Header>
              <Card.Title>Top Job Categories</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                {analytics?.categories?.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.jobCount} jobs
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(category.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart('User Growth Trend', analytics?.userGrowth, 'line')}
            {renderChart('Job Posting Trends', analytics?.jobTrends, 'bar')}
          </div>

          {/* Performance Metrics */}
          <Card>
            <Card.Header>
              <Card.Title>Performance Metrics</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics?.performance?.responseTime || '0'}ms
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(analytics?.performance?.uptime || 0).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">System Uptime</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(analytics?.performance?.activeConnections || 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Connections</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics?.performance?.errorRate || '0'}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Error Rate</div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard; 