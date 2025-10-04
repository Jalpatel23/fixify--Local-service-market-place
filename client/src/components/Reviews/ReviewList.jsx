import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Filter, MessageCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import ReviewCard from './ReviewCard';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';
import Pagination from '../UI/Pagination';
import Button from '../UI/Button';

const ReviewList = ({ 
  userId, 
  showJobInfo = false,
  onEdit,
  className = '' 
}) => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('approved');
  const [showFilters, setShowFilters] = useState(false);

  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['reviews', userId, page, status],
    queryFn: () => apiService.reviews.getUserReviews(userId, { page, limit: 10, status }),
    placeholderData: (prev) => prev, // keepPreviousData replacement
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1); // Reset to first page when changing filters
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
        icon={<MessageCircle className="h-12 w-12" />}
        title="Error loading reviews"
        description="There was an error loading the reviews. Please try again."
      />
    );
  }

  if (!reviews?.data?.length) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-12 w-12" />}
        title="No reviews yet"
        description="This user hasn't received any reviews yet."
      />
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Reviews ({reviews.pagination.total})
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-md">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Status:
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-secondary-100"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.data.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            showJobInfo={showJobInfo}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Pagination */}
      {reviews.pagination.pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={reviews.pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ReviewList; 