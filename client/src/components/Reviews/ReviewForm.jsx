import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Send, X } from 'lucide-react';
import { apiService } from '../../services/api';
import Button from '../UI/Button';
import Card from '../UI/Card';
import toast from 'react-hot-toast';

const ReviewForm = ({ 
  jobId, 
  revieweeId, 
  revieweeName, 
  onSuccess, 
  onCancel,
  className = '' 
}) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState({
    communication: 5,
    quality: 5,
    timeliness: 5,
    professionalism: 5,
    value: 5
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => apiService.reviews.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', revieweeId] });
      queryClient.invalidateQueries({ queryKey: ['user', revieweeId] });
      toast.success('Review submitted successfully!');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const reviewData = {
      jobId,
      revieweeId,
      rating,
      title: title.trim(),
      content: content.trim(),
      categories
    };

    createReviewMutation.mutate(reviewData);
  };

  const handleCategoryChange = (category, value) => {
    setCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const renderStars = (value, onChange, size = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-yellow-400 hover:text-yellow-500 transition-colors"
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= value ? 'fill-current' : 'fill-none'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      <Card.Header>
        <Card.Title>Write a Review</Card.Title>
        <Card.Description>
          Share your experience working with {revieweeName}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Overall Rating *
            </label>
            {renderStars(rating, setRating, 'lg')}
            <p className="text-sm text-secondary-500 mt-1">
              {rating} out of 5 stars
            </p>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your experience"
              maxLength={100}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              required
            />
            <p className="text-xs text-secondary-500 mt-1">
              {title.length}/100 characters
            </p>
          </div>

          {/* Review Content */}
          <div>
            <label className="block text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Review Details *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your detailed experience..."
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-800 dark:text-secondary-100"
              required
            />
            <p className="text-xs text-secondary-500 mt-1">
              {content.length}/1000 characters
            </p>
          </div>

          {/* Category Ratings */}
          <div>
            <label className="block text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3">
              Detailed Ratings
            </label>
            <div className="space-y-3">
              {Object.entries(categories).map(([category, value]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-secondary-700 dark:text-secondary-300 capitalize">
                    {category}
                  </span>
                  {renderStars(value, (newValue) => handleCategoryChange(category, newValue), 'sm')}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={createReviewMutation.isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createReviewMutation.isLoading}
              disabled={!title.trim() || !content.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Review
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

export default ReviewForm; 