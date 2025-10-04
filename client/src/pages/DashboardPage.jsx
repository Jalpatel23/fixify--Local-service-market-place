import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Plus,
  TrendingUp,
  Users,
  CheckCircle,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const DashboardPage = () => {
  const { user, isLoaded, isSignedIn, tokenReady } = useAuth();
  const { getToken } = useClerkAuth();

  // Fetch user's jobs
  const { data: myJobsData = [], isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      try {
        const response = await apiService.jobs.myJobs();
        const jobs = response.data?.data || response.data || response || [];
        // Ensure we always return an array
        return Array.isArray(jobs) ? jobs : [];
      } catch (error) {
        console.error('Failed to fetch my jobs:', error);
        return [];
      }
    },
    enabled: !!user && isLoaded && isSignedIn && tokenReady
  });

  // Ensure myJobs is always an array
  const myJobs = Array.isArray(myJobsData) ? myJobsData : [];

  // Debug logging (commented out)
  // console.log('Dashboard - user:', user);
  // console.log('Dashboard - jobsError:', jobsError);
  // console.log('Dashboard - myJobsData:', myJobsData);
  // console.log('Dashboard - myJobs:', myJobs);

  // Debug budget structure
  if (myJobs.length > 0) {
    console.log('Sample job budget structure:', myJobs[0].budget);
    console.log('Sample job minBudget:', myJobs[0].minBudget);
    console.log('Sample job maxBudget:', myJobs[0].maxBudget);
  }

  // Calculate stats from available data
  const stats = React.useMemo(() => {
    if (!myJobs || myJobs.length === 0) {
      return {
        jobsPosted: 0,
        jobsCompleted: 0,
        jobsInProgress: 0,
        jobsOpen: 0,
        totalEarnings: 0,
        averageJobValue: 0
      };
    }

    const jobsPosted = myJobs.length;
    const jobsCompleted = myJobs.filter(job => job.status === 'completed').length;
    const jobsInProgress = myJobs.filter(job => job.status === 'in_progress' || job.status === 'accepted').length;
    const jobsOpen = myJobs.filter(job => job.status === 'open').length;

    const totalEarnings = myJobs
      .filter(job => job.status === 'completed')
      .reduce((total, job) => {
        let budget = 0;
        if (typeof job.budget === 'number') {
          budget = job.budget;
        } else if (typeof job.minBudget === 'number') {
          budget = job.minBudget;
        } else if (job.budget && typeof job.budget.min === 'number') {
          budget = job.budget.min;
        } else if (job.budget && typeof job.budget.max === 'number') {
          budget = job.budget.max;
        }
        return total + budget;
      }, 0);

    const totalBudget = myJobs.reduce((total, job) => {
      // Handle different budget structures
      let budget = 0;
      if (typeof job.budget === 'number') {
        budget = job.budget;
      } else if (typeof job.minBudget === 'number') {
        budget = job.minBudget;
      } else if (job.budget && typeof job.budget.min === 'number') {
        budget = job.budget.min;
      } else if (job.budget && typeof job.budget.max === 'number') {
        budget = job.budget.max;
      }
      return total + budget;
    }, 0);

    const averageJobValue = jobsPosted > 0 && totalBudget > 0
      ? totalBudget / jobsPosted
      : 0;

    return {
      jobsPosted,
      jobsCompleted,
      jobsInProgress,
      jobsOpen,
      totalEarnings,
      averageJobValue
    };
  }, [myJobs]);

  // Fetch recent notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const token = await getToken();
        const response = await fetch('http://localhost:5000/api/notifications?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!user && isLoaded && isSignedIn && tokenReady
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
      case 'accepted': return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
      case 'in_progress': return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
      case 'completed': return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200';
      default: return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-200';
    }
  };

  if (jobsLoading || notificationsLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Here's what's happening with your jobs and services.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Jobs Posted</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  {stats.jobsPosted}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Jobs Completed</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  {stats.jobsCompleted}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Active Jobs</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  {stats.jobsInProgress + stats.jobsOpen}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-error-100 dark:bg-error-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-error-600 dark:text-error-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">Total Earnings</p>
                <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                  ${stats.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        {myJobs.length > 0 && (
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-8">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Job Status Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.jobsOpen}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Open</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.jobsInProgress}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.jobsCompleted}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${stats.averageJobValue.toFixed(0)}
                </p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Avg. Value</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Jobs */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700">
              <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    My Jobs
                  </h2>
                  <Link
                    to="/post-job"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post Job
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {myJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                      No jobs yet
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                      Start by posting your first job to find local professionals.
                    </p>
                    <Link
                      to="/post-job"
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Job
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myJobs.slice(0, 5).map((job) => (
                      <Link
                        key={job._id}
                        to={`/jobs/${job._id}`}
                        className="block p-4 border border-secondary-200 dark:border-secondary-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">
                              {job.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
                              <span className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                ${job.budget?.min} - ${job.budget?.max}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(job.createdAt)}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </Link>
                    ))}

                    <div className="text-center pt-4">
                      <Link
                        to="/my-jobs"
                        className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-200 border border-primary-200 dark:border-primary-700/30"
                      >
                        <span className="mr-2">📋</span>
                        View all my jobs
                        <span className="ml-2">→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 mt-6">
              <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
                <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Quick Actions
                </h2>
              </div>

              <div className="p-6 space-y-3">
                <Link
                  to="/post-job"
                  className="flex items-center p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Post a Job
                  </span>
                </Link>

                <Link
                  to="/browse"
                  className="flex items-center p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Browse Jobs
                  </span>
                </Link>

                <Link
                  to="/saved-jobs"
                  className="flex items-center p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <Bookmark className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Saved Jobs
                  </span>
                </Link>

                <Link
                  to="/my-jobs"
                  className="flex items-center p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <span className="mr-2">📋</span>
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  View all my jobs
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;