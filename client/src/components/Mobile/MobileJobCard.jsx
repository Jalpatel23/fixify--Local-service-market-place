import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import AuthPrompt from '../Auth/AuthPrompt';

const MobileJobCard = ({ job, onSave, onShare }) => {
  const navigate = useNavigate();

  const formatBudget = (budget) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(budget);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'success',
      accepted: 'warning',
      in_progress: 'info',
      completed: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  const handleCardPress = () => {
    navigate(`/jobs/${job._id}`);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    onSave?.(job._id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: job.description,
        url: `${window.location.origin}/jobs/${job._id}`
      });
    } else {
      onShare?.(job);
    }
  };

  const handleMessage = (e) => {
    e.stopPropagation();
    navigate(`/messages?job=${job._id}`);
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4 shadow-sm hover:shadow-md transition-shadow touch-manipulation"
      onClick={handleCardPress}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {job.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getStatusColor(job.status)} size="sm">
              {job.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {job.isUrgent && (
              <Badge variant="error" size="sm">
                URGENT
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-right ml-3">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatBudget(job.budget?.min || job.budget?.max || 0)}
          </div>
          {job.budget?.isNegotiable && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Negotiable
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
        {job.description}
      </p>

      {/* Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="truncate">
            {job.location?.address?.city}, {job.location?.address?.state}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          <span>{formatTimeAgo(job.createdAt)}</span>
        </div>
      </div>

      {/* Creator Info */}
      {job.creator && (
        <div className="flex items-center mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
              {job.creator.firstName?.[0]}{job.creator.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {job.creator.firstName} {job.creator.lastName}
            </div>
            {job.creator.rating && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                <span>{job.creator.rating.average?.toFixed(1)} ({job.creator.rating.totalReviews} reviews)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {job.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
          {job.tags.length > 3 && (
            <Badge variant="outline" size="sm">
              +{job.tags.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <AuthPrompt requireAuth={true} promptMessage="Please sign in to save this job">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-1"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </AuthPrompt>
          
          <AuthPrompt requireAuth={true} promptMessage="Please sign in to message the job creator">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMessage}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Message</span>
            </Button>
          </AuthPrompt>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex items-center gap-1"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* Quick Actions for Mobile */}
      <div className="mt-3 flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCardPress}
          className="flex-1"
        >
          View Details
        </Button>
        
        <AuthPrompt requireAuth={true} promptMessage="Please sign in to accept this job">
          <Button
            variant="success"
            size="sm"
            onClick={handleCardPress}
            className="flex-1"
          >
            Accept Job
          </Button>
        </AuthPrompt>
      </div>
    </div>
  );
};

export default MobileJobCard; 