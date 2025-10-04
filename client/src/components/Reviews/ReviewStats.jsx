import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';
import { apiService } from '../../services/api';
import Card from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import EmptyState from '../UI/EmptyState';

const ReviewStats = ({ userId, className = '' }) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['reviewStats', userId],
    queryFn: () => apiService.reviews.getUserReviewStats(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
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
        icon={<Star className="h-12 w-12" />}
        title="Error loading review statistics"
        description="There was an error loading the review statistics. Please try again."
      />
    );
  }

  if (!stats?.data) {
    return (
      <EmptyState
        icon={<Star className="h-12 w-12" />}
        title="No review statistics"
        description="This user hasn't received any reviews yet."
      />
    );
  }

  const { averageRating, totalReviews, ratingDistribution, categories } = stats.data;

  const renderStars = (rating, size = 'md') => {
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

  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-secondary-600 dark:text-secondary-400 w-8">
          {rating}★
        </span>
        <div className="flex-1 bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-secondary-600 dark:text-secondary-400 w-12 text-right">
          {count}
        </span>
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 4.0) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 3.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Rating */}
      <Card>
        <Card.Header>
          <Card.Title>Overall Rating</Card.Title>
          <Card.Description>
            Based on {totalReviews} reviews
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary-900 dark:text-secondary-100">
                {averageRating.toFixed(1)}
              </div>
              {renderStars(averageRating, 'lg')}
              <p className="text-sm text-secondary-500 mt-1">
                {totalReviews} reviews
              </p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating}>
                  {renderRatingBar(rating, ratingDistribution[rating] || 0, totalReviews)}
                </div>
              ))}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <Card.Header>
          <Card.Title>Category Breakdown</Card.Title>
          <Card.Description>
            Detailed ratings by category
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            {Object.entries(categories).map(([category, rating]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100 capitalize w-24">
                    {category}
                  </span>
                  {renderStars(rating, 'sm')}
                </div>
                <span className={`text-sm font-medium ${getRatingColor(rating)}`}>
                  {rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Excellent (5★)
                </p>
                <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  {ratingDistribution[5] || 0}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Good (4★)
                </p>
                <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  {ratingDistribution[4] || 0}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Poor (1-3★)
                </p>
                <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  {(ratingDistribution[1] || 0) + (ratingDistribution[2] || 0) + (ratingDistribution[3] || 0)}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default ReviewStats; 