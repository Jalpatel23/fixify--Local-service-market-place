import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Star,
  ArrowLeft,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import JobCard from '../components/Jobs/JobCard';
import { jobCategories } from '../utils/config';

const SavedJobsPage = () => {
  const { isLoaded, isSignedIn, tokenReady } = useAuth();

  // State for filters
  const [filters, setFilters] = React.useState({
    category: '',
    minBudget: '',
    maxBudget: '',
    search: ''
  });

  // Fetch saved jobs
  const { data: savedJobsData, isLoading, error } = useQuery({
    queryKey: ['saved-jobs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
      if (filters.search) params.append('search', filters.search);
      const response = await apiService.jobs.savedJobs(params);
      return response.data;
    },
    enabled: isLoaded && isSignedIn && tokenReady
  });

  const savedJobs = savedJobsData?.data || [];
  const pagination = savedJobsData?.pagination;
  const totalPages = pagination?.pages || pagination?.totalPages || 0;

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      minBudget: '',
      maxBudget: '',
      search: ''
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              Error Loading Saved Jobs
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              {error.message || 'Failed to load your saved jobs'}
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 flex items-center">
                <Bookmark className="w-8 h-8 mr-3 text-primary-600" />
                Saved Jobs
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400 mt-2">
                {savedJobs.length} {savedJobs.length === 1 ? 'job' : 'jobs'} saved
              </p>
            </div>
            <Link
              to="/browse"
              className="inline-flex items-center px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse More Jobs
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {jobCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Budget */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Min Budget
              </label>
              <input
                type="number"
                placeholder="Min $"
                value={filters.minBudget}
                onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Max Budget */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Max Budget
              </label>
              <input
                type="number"
                placeholder="Max $"
                value={filters.maxBudget}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {savedJobs.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
              No Saved Jobs Yet
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              Start browsing jobs and save the ones you're interested in to view them here later.
            </p>
            <Link
              to="/browse"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job) => (
              <JobCard key={job._id} {...job} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setFilters(prev => ({ ...prev, page }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    page === pagination?.currentPage
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 border border-secondary-300 dark:border-secondary-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobsPage;
