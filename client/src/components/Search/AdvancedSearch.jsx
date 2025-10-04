import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Calendar,
  Star,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../../services/api';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { JobCard } from '../Jobs/JobCard';

const AdvancedSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minBudget: '',
    maxBudget: '',
    status: 'open',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);

  // Get search filters
  const { data: searchFilters } = useQuery({
    queryKey: ['search-filters'],
    queryFn: () => api.search.getSearchFilters(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Search jobs
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['advanced-search', { searchQuery, filters, page }],
    queryFn: () => api.search.advancedSearch({
      q: searchQuery,
      ...filters,
      page
    }),
    enabled: searchQuery.length > 0 || Object.values(filters).some(v => v !== '' && v !== 'open' && v !== 'date' && v !== 'desc'),
    staleTime: 30 * 1000 // 30 seconds
  });

  // Get search suggestions
  const { data: searchSuggestions } = useQuery({
    queryKey: ['search-suggestions', searchQuery],
    queryFn: () => api.search.searchSuggestions({ q: searchQuery }),
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  useEffect(() => {
    if (searchSuggestions?.suggestions) {
      setSuggestions(searchSuggestions.suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchSuggestions]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setShowSuggestions(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'category') {
      setFilters(prev => ({ ...prev, category: suggestion.text }));
    } else {
      setSearchQuery(suggestion.text);
    }
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minBudget: '',
      maxBudget: '',
      status: 'open',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 'open' && v !== 'date' && v !== 'desc');

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Advanced Search
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Find the perfect job with advanced filters and search
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" size="sm">
              {Object.values(filters).filter(v => v !== '' && v !== 'open' && v !== 'date' && v !== 'desc').length}
            </Badge>
          )}
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search jobs, categories, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Search className="h-4 w-4 text-gray-400" />
                <span>{suggestion.text}</span>
                {suggestion.category && (
                  <Badge variant="outline" size="sm">
                    {suggestion.category}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <Card.Content className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {searchFilters?.categories?.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label} ({category.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minBudget}
                    onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxBudget}
                    onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">Date Posted</option>
                  <option value="budget">Budget</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Search Results */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Error loading search results</div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : searchResults?.jobs ? (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {searchResults.pagination.total} jobs found
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {filters.category && (
                  <Badge variant="outline" size="sm">
                    Category: {filters.category}
                  </Badge>
                )}
                {(filters.minBudget || filters.maxBudget) && (
                  <Badge variant="outline" size="sm">
                    Budget: ${filters.minBudget || 0} - ${filters.maxBudget || '∞'}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Jobs List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>

          {/* Pagination */}
          {searchResults.pagination.pages > 1 && (
            <div className="flex justify-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {searchResults.pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === searchResults.pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Start your search
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter keywords, select filters, and find the perfect job
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch; 