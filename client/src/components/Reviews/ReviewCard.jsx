import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  MessageCircle, 
  Edit, 
  Trash2,
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import { apiService } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import toast from 'react-hot-toast';

const ReviewCard = ({ 
  review, 
  showJobInfo = false,
  onEdit,
  className = '' 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [showActions, setShowActions] = useState(false);

  const isOwnReview = review.reviewer.clerkId === user?.id;
  const isReviewee = review.reviewee.clerkId === user?.id;

  // Mutations
  const markHelpfulMutation = useMutation({
    mutationFn: ({ reviewId, isHelpful }) => apiService.reviews.markReviewHelpful(reviewId, isHelpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', review.reviewee.clerkId] });
    }
  });

  const flagReviewMutation = useMutation({
    mutationFn: ({ reviewId, reason }) => apiService.reviews.flagReview(reviewId, reason),
    onSuccess: () => {
      toast.success('Review flagged successfully');
    }
  });

  const respondToReviewMutation = useMutation({
    mutationFn: ({ reviewId, content }) => apiService.reviews.respondToReview(reviewId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', review.reviewee.clerkId] });
      setShowResponseForm(false);
      setResponseContent('');
      toast.success('Response added successfully');
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => apiService.reviews.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', review.reviewee.clerkId] });
      toast.success('Review deleted successfully');
    }
  });

  // Handlers
  const handleMarkHelpful = (isHelpful) => {
    markHelpfulMutation.mutate({
      reviewId: review._id,
      isHelpful
    });
  };

  const handleFlagReview = (reason) => {
    flagReviewMutation.mutate({
      reviewId: review._id,
      reason
    });
  };

  const handleRespondToReview = (e) => {
    e.preventDefault();
    if (!responseContent.trim()) {
      toast.error('Please enter a response');
      return;
    }

    respondToReviewMutation.mutate({
      reviewId: review._id,
      content: responseContent.trim()
    });
  };

  const handleDeleteReview = () => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReviewMutation.mutate(review._id);
    }
  };

  const renderStars = (rating, size = 'sm') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-secondary-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderCategoryRating = (category, rating) => (
    <div key={category} className="flex items-center justify-between text-sm">
      <span className="text-secondary-600 dark:text-secondary-400 capitalize">
        {category}
      </span>
      {renderStars(rating, 'xs')}
    </div>
  );

  return (
    <Card className={className}>
      <Card.Content className="p-4">
        {/* Review Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {review.reviewer.profileImage ? (
              <img
                src={review.reviewer.profileImage}
                alt={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center">
                <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                  {review.reviewer.firstName?.[0]}
                </span>
              </div>
            )}
            <div>
              <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                {review.reviewer.firstName} {review.reviewer.lastName}
              </h4>
              <p className="text-sm text-secondary-500">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-md shadow-lg z-10 min-w-[150px]">
                {isOwnReview && (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.(review);
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteReview();
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </>
                )}
                {!isOwnReview && (
                  <button
                    onClick={() => {
                      handleFlagReview('inappropriate');
                      setShowActions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Flag
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Job Info */}
        {showJobInfo && review.job && (
          <div className="mb-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-md">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Job: <span className="font-medium">{review.job.title}</span>
            </p>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          {renderStars(review.rating, 'md')}
          <span className="text-sm text-secondary-600 dark:text-secondary-400">
            {review.rating} out of 5
          </span>
        </div>

        {/* Review Title */}
        <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-2">
          {review.title}
        </h3>

        {/* Review Content */}
        <p className="text-secondary-700 dark:text-secondary-300 mb-4">
          {review.content}
        </p>

        {/* Category Ratings */}
        <div className="mb-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-md">
          <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            Detailed Ratings
          </h4>
          <div className="space-y-1">
            {Object.entries(review.categories).map(([category, rating]) =>
              renderCategoryRating(category, rating)
            )}
          </div>
        </div>

        {/* Response */}
        {review.response && (
          <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md border-l-4 border-primary-500">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Response from {review.reviewee.firstName} {review.reviewee.lastName}
              </span>
              <span className="text-xs text-secondary-500">
                {formatDistanceToNow(new Date(review.response.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-secondary-700 dark:text-secondary-300">
              {review.response.content}
            </p>
          </div>
        )}

        {/* Response Form */}
        {isReviewee && !review.response && showResponseForm && (
          <form onSubmit={handleRespondToReview} className="mb-4">
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder="Write a response to this review..."
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              required
            />
            <div className="flex items-center space-x-2 mt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={respondToReviewMutation.isLoading}
                disabled={!responseContent.trim()}
              >
                <Check className="w-4 h-4 mr-1" />
                Respond
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowResponseForm(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Review Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleMarkHelpful(true)}
              disabled={markHelpfulMutation.isLoading}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                review.helpfulBy.includes(user?.id)
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{review.helpfulVotes.up}</span>
            </button>

            {isReviewee && !review.response && (
              <button
                onClick={() => setShowResponseForm(!showResponseForm)}
                className="flex items-center space-x-1 text-sm text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Respond</span>
              </button>
            )}
          </div>

          {/* Review Status */}
          {review.status !== 'approved' && (
            <Badge
              variant={review.status === 'pending' ? 'warning' : 'error'}
              size="sm"
            >
              {review.status}
            </Badge>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

export default ReviewCard; 