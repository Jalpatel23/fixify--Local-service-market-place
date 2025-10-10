import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, User, Filter, Search, MessageCircle, Bookmark } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import AuthPrompt from '../components/Auth/AuthPrompt';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { calculateDistance } from '../utils/mapUtils';

const BrowsePage = () => {
  const { user, profile, isLoaded, isSignedIn, tokenReady } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For the input field
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [savedOnly, setSavedOnly] = useState(false);
  const [myJobsOnly, setMyJobsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allJobs, setAllJobs] = useState([]);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [componentId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [forceRefresh, setForceRefresh] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(25);
  const [locationLoading, setLocationLoading] = useState(false);

  const getLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLoading(false);
        },
        (error) => {
          alert('Location access denied or unavailable.');
          setLocationLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setLocationLoading(false);
    }
  };

  const sortJobsByDistance = () => {
    if (!userLocation) return;
    
    setAllJobs(prevJobs => {
      const jobsWithDistance = prevJobs.map(job => {
        if (!job.location?.coordinates) {
          return { ...job, distance: Infinity };
        }
        
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          job.location.coordinates[1],
          job.location.coordinates[0]
        );
        
        return { ...job, distance };
      });
      
      const sortedJobs = jobsWithDistance.sort((a, b) => a.distance - b.distance);
      
      return sortedJobs;
    });
  };

  // Fetch initial jobs from API
  const { data: initialJobsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['jobs', searchTerm, selectedCategory, sortBy, savedOnly, myJobsOnly, componentId, forceRefresh],
    queryFn: async () => {
      console.log('BrowsePage: Query function called with params:', {
        searchTerm,
        selectedCategory,
        sortBy,
        savedOnly,
        myJobsOnly
      });
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      // Don't pass status parameter to show all jobs (open, accepted, completed, etc.)
      // Note: Location-based filtering is handled client-side for sorting only
      
      // Map frontend sort values to backend parameters
      let sortByParam, sortOrderParam;
      switch (sortBy) {
        case 'newest':
          sortByParam = 'createdAt';
          sortOrderParam = 'desc';
          break;
        case 'oldest':
          sortByParam = 'createdAt';
          sortOrderParam = 'asc';
          break;
        case 'budget_high':
          sortByParam = 'budget.max';
          sortOrderParam = 'desc';
          break;
        case 'budget_low':
          sortByParam = 'budget.max';
          sortOrderParam = 'asc';
          break;
        default:
          sortByParam = 'createdAt';
          sortOrderParam = 'desc';
      }
      
      params.append('sortBy', sortByParam);
      params.append('sortOrder', sortOrderParam);
      params.append('page', '1'); // Always start with page 1

      try {
        // Authenticated views
        if ((savedOnly || myJobsOnly) && isLoaded && isSignedIn && tokenReady) {
          if (savedOnly) {
            const resp = await apiService.jobs.savedJobs(Object.fromEntries(params));
            const data = resp.data?.data || resp.data || [];
            return {
              jobs: Array.isArray(data) ? data : [],
              pagination: { total: data.length, pages: 1, page: 1 },
              hasMore: false
            };
          }
          if (myJobsOnly) {
            const resp = await apiService.jobs.myJobs(Object.fromEntries(params));
            const data = resp.data?.data || resp.data || [];
            return {
              jobs: Array.isArray(data) ? data : [],
              pagination: { total: data.length, pages: 1, page: 1 },
              hasMore: false
            };
          }
        }

        // Use browse endpoint for better filtering and sorting
        console.log('BrowsePage: Making API call to browse.jobs with params:', Object.fromEntries(params));
        const response = await apiService.browse.jobs(Object.fromEntries(params));
        console.log('BrowsePage: API response:', response);
        const data = response.data?.data || response.data || [];
        const pagination = response.data?.pagination || response.pagination;
        
        console.log('BrowsePage: Processed data:', { data, pagination, dataLength: data.length });
        
        return {
          jobs: Array.isArray(data) ? data : [],
          pagination: pagination,
          hasMore: pagination ? 1 < pagination.pages : false
        };
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        return { jobs: [], pagination: { total: 0, pages: 1, page: 1 }, hasMore: false };
      }
    }
  });

  // Handle initial jobs data
  React.useEffect(() => {
    console.log('BrowsePage: initialJobsData changed:', initialJobsData);
    if (initialJobsData && initialJobsData.jobs) {
      console.log('BrowsePage: Setting jobs from initialJobsData:', initialJobsData.jobs.length, 'jobs');
      setAllJobs(initialJobsData.jobs);
      setHasMoreJobs(initialJobsData.hasMore || false);
      setCurrentPage(1);
    } else if (initialJobsData && !initialJobsData.jobs) {
      // Handle case where query returns empty data
      console.log('BrowsePage: No jobs in initialJobsData, clearing jobs');
      setAllJobs([]);
      setHasMoreJobs(false);
    }
  }, [initialJobsData]);

  // Sort jobs by distance when userLocation is available and jobs are loaded
  React.useEffect(() => {
    if (userLocation && allJobs.length > 0) {
      sortJobsByDistance();
    }
  }, [userLocation, allJobs]);

  // Debounced search effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
    setHasMoreJobs(true);
    // Clear jobs when filters change to show loading state
    setAllJobs([]);
  }, [searchTerm, selectedCategory, sortBy, savedOnly, myJobsOnly]);

  // Handle component mount
  React.useEffect(() => {
    setMounted(true);
    // Force refresh when component mounts to ensure fresh data
    setForceRefresh(prev => prev + 1);
    return () => setMounted(false);
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log('BrowsePage state:', {
      componentId,
      forceRefresh,
      isLoading,
      isFetching,
      hasInitialData: !!initialJobsData,
      initialJobsData,
      jobsCount: allJobs.length,
      allJobs,
      searchTerm,
      selectedCategory,
      sortBy,
      savedOnly,
      myJobsOnly,
      userLocation,
      mounted
    });
  }, [componentId, forceRefresh, isLoading, isFetching, initialJobsData, allJobs.length, allJobs, searchTerm, selectedCategory, sortBy, savedOnly, myJobsOnly, mounted]);

  // Load more jobs function
  const loadMoreJobs = async () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      // Note: Location-based filtering is handled client-side for sorting only
      
      // Map frontend sort values to backend parameters
      let sortByParam, sortOrderParam;
      switch (sortBy) {
        case 'newest':
          sortByParam = 'createdAt';
          sortOrderParam = 'desc';
          break;
        case 'oldest':
          sortByParam = 'createdAt';
          sortOrderParam = 'asc';
          break;
        case 'budget_high':
          sortByParam = 'budget.max';
          sortOrderParam = 'desc';
          break;
        case 'budget_low':
          sortByParam = 'budget.max';
          sortOrderParam = 'asc';
          break;
        default:
          sortByParam = 'createdAt';
          sortOrderParam = 'desc';
      }
      
      params.append('sortBy', sortByParam);
      params.append('sortOrder', sortOrderParam);
      params.append('page', (currentPage + 1).toString());

      let response;
      if ((savedOnly || myJobsOnly) && isLoaded && isSignedIn && tokenReady) {
        if (savedOnly) {
          response = await apiService.jobs.savedJobs(Object.fromEntries(params));
        } else if (myJobsOnly) {
          response = await apiService.jobs.myJobs(Object.fromEntries(params));
        }
      } else {
        response = await apiService.browse.jobs(Object.fromEntries(params));
      }

      const data = response.data?.data || response.data || [];
      const pagination = response.data?.pagination || response.pagination;
      
      if (Array.isArray(data) && data.length > 0) {
        setAllJobs(prev => [...prev, ...data]);
        setCurrentPage(prev => prev + 1);
        setHasMoreJobs(pagination ? (currentPage + 1) < pagination.pages : false);
      } else {
        setHasMoreJobs(false);
      }
    } catch (error) {
      console.error('Failed to load more jobs:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchTerm(searchInput);
    }
  };

  // Handle immediate search (for search button if needed)
  const handleSearchSubmit = () => {
    setSearchTerm(searchInput);
  };

  const categories = [
    'plumbing', 'electrical', 'carpentry', 'cleaning',
    'gardening', 'painting', 'moving', 'repair'
  ];

  const formatBudget = (min, max) => {
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };

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
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              Browse Jobs
            </h1>
            <div className="bg-error-50 dark:bg-error-900 border border-error-200 dark:border-error-700 rounded-lg p-4">
              <p className="text-error-800 dark:text-error-200">
                Failed to load jobs. Please try again later.
              </p>
            </div>
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
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Browse Jobs
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Find local service opportunities in your area
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs... (press Enter to search)"
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="budget_high">Highest Budget</option>
              <option value="budget_low">Lowest Budget</option>
            </select>
          </div>

          {/* Extra toggles */}
          <div className={`mt-4 grid grid-cols-1 gap-4 ${isLoaded && isSignedIn && tokenReady ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
            {isLoaded && isSignedIn && tokenReady && (
              <>
                <label className="inline-flex items-center gap-2 text-secondary-700 dark:text-secondary-300">
                  <input
                    type="checkbox"
                    checked={savedOnly}
                    onChange={(e) => { setSavedOnly(e.target.checked); if (e.target.checked) setMyJobsOnly(false); }}
                  />
                  <span>Saved only</span>
                </label>
                <label className="inline-flex items-center gap-2 text-secondary-700 dark:text-secondary-300">
                  <input
                    type="checkbox"
                    checked={myJobsOnly}
                    onChange={(e) => { setMyJobsOnly(e.target.checked); if (e.target.checked) setSavedOnly(false); }}
                  />
                  <span>My jobs</span>
                </label>
              </>
            )}
            <label className="inline-flex items-center gap-2 text-secondary-700 dark:text-secondary-300">
              <input
                type="checkbox"
                checked={!!userLocation}
                onChange={() => getLocation()}
                disabled={locationLoading}
              />
              <span>{locationLoading ? 'Getting location...' : 'Find distance'}</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-secondary-600 dark:text-secondary-400">
            {allJobs.length} job{allJobs.length !== 1 ? 's' : ''} found
            {hasMoreJobs && ` (showing ${allJobs.length} of ${initialJobsData?.pagination?.total || 'many'})`}
          </p>
        </div>

        {/* Jobs Grid */}
        {allJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              No jobs found
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allJobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 hover:shadow-md transition-shadow duration-200 p-6 block"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {profile?._id && job.creator?._id === profile._id && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
                        YOUR JOB
                      </span>
                    )}
                  </div>
                  {job.isUrgent && (
                    <span className="px-2 py-1 bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200 rounded-full text-xs font-medium">
                      URGENT
                    </span>
                  )}
                </div>

                {/* Job Title */}
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2 line-clamp-2">
                  {job.title}
                </h3>

                {/* Description */}
                <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4 line-clamp-3">
                  {job.description}
                </p>

                {/* Job Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {formatBudget(job.budget?.min, job.budget?.max)}
                  </div>
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {job.location?.address?.city}, {job.location?.address?.state}
                  </div>
                  {userLocation && job.location?.coordinates && (
                    <div className="flex items-center text-sm text-primary-600 dark:text-primary-400">
                      <span className="mr-2">📍</span>
                      {(() => {
                        const distKm = calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          job.location.coordinates[1],
                          job.location.coordinates[0]
                        );
                        return `Distance from you: ${distKm.toFixed(1)} km`;
                      })()}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatDate(job.preferredDate)}
                  </div>
                  {job.creator && (
                    <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
                      <User className="w-4 h-4 mr-2" />
                      {job.creator.firstName} {job.creator.lastName}
                    </div>
                  )}
                </div>

                {/* Category Tag and Actions */}
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full text-xs font-medium">
                    {job.category}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">
                      {formatDate(job.createdAt)}
                    </span>
                    
                    {/* Action buttons for logged-in users */}
                    {profile?._id && job.creator?._id !== profile._id && (
                      <>
                        <AuthPrompt requireAuth={true} promptMessage="Please sign in to save this job">
                          <button
                            className="p-1 text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Save job"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </AuthPrompt>
                        
                        <AuthPrompt requireAuth={true} promptMessage="Please sign in to message the job creator">
                          <Link
                            to={`/messages?user=${job.creator._id}`}
                            className="p-1 text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="Message creator"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Link>
                        </AuthPrompt>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMoreJobs && allJobs.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMoreJobs}
              disabled={isLoadingMore}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoadingMore ? (
                <>
                  <LoadingSpinner />
                  <span className="ml-2">Loading more jobs...</span>
                </>
              ) : (
                'Load More Jobs'
              )}
            </button>
          </div>
        )}

        {/* Loading indicator below jobs when loading more */}
        {isLoadingMore && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center text-secondary-600 dark:text-secondary-400">
              <LoadingSpinner />
              <span className="ml-2">Loading more jobs...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;