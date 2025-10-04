import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter, 
  Search,
  Star,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Card } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Modal } from '../UI/Modal';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { EmptyState } from '../UI/EmptyState';

const ReviewModeration = () => {
  const [filters, setFilters] = useState({
    status: 'pending',
    rating: '',
    search: ''
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  // Fetch reviews for moderation
  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['admin', 'reviews', filters],
    queryFn: () => api.admin.getReviewsForModeration(filters),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Moderate review mutation
  const moderateReviewMutation = useMutation({
    mutationFn: ({ reviewId, status, reason }) => 
      api.admin.updateReviewStatus(reviewId, { status, reason }),
    onSuccess: () => {
      toast.success('Review status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      setSelectedReview(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update review status');
    }
  });

  const handleModerateReview = (reviewId, status, reason = '') => {
    moderateReviewMutation.mutate({ reviewId, status, reason });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const ReviewDetailModal = () => (
    <Modal
      isOpen={!!selectedReview}
      onClose={() => setSelectedReview(null)}
      title="Review Details"
      size="lg"
    >
      {selectedReview && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Reviewer</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReview.reviewer?.firstName} {selectedReview.reviewer?.lastName}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Reviewee</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReview.reviewee?.firstName} {selectedReview.reviewee?.lastName}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Job</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedReview.job?.title}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Rating</h4>
            <div className="flex items-center gap-2">
              {renderStars(selectedReview.rating)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReview.rating}/5
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Title</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedReview.title}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Content</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedReview.content}
            </p>
          </div>

          {selectedReview.categories && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Category Ratings</h4>
              <div className="space-y-2">
                {Object.entries(selectedReview.categories).map(([category, rating]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{category}</span>
                    <div className="flex items-center gap-1">
                      {renderStars(rating)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            {getStatusBadge(selectedReview.status)}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="success"
              size="sm"
              onClick={() => handleModerateReview(selectedReview._id, 'approved')}
              disabled={moderateReviewMutation.isLoading}
            >
              <CheckCircle size={16} className="mr-2" />
              Approve
            </Button>
            <Button
              variant="error"
              size="sm"
              onClick={() => handleModerateReview(selectedReview._id, 'rejected')}
              disabled={moderateReviewMutation.isLoading}
            >
              <XCircle size={16} className="mr-2" />
              Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReview(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Error Loading Reviews
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.response?.data?.message || 'Failed to load reviews'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Moderation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review and moderate user-submitted reviews
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} className="mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Ratings</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search reviews..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  leftIcon={<Search size={16} />}
                />
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : reviews?.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="No Reviews Found"
          description="No reviews match the current filters."
        />
      ) : (
        <div className="space-y-4">
          {reviews?.map((review) => (
            <Card key={review._id}>
              <Card.Content>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {review.title}
                      </h3>
                      {getStatusBadge(review.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>Rating:</span>
                        {renderStars(review.rating)}
                      </div>
                      <div>
                        <span>By:</span> {review.reviewer?.firstName} {review.reviewer?.lastName}
                      </div>
                      <div>
                        <span>For:</span> {review.reviewee?.firstName} {review.reviewee?.lastName}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {review.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReview(review)}
                    >
                      <Eye size={16} />
                    </Button>
                    {review.status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleModerateReview(review._id, 'approved')}
                          disabled={moderateReviewMutation.isLoading}
                        >
                          <CheckCircle size={16} />
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleModerateReview(review._id, 'rejected')}
                          disabled={moderateReviewMutation.isLoading}
                        >
                          <XCircle size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      <ReviewDetailModal />
    </div>
  );
};

export default ReviewModeration; 