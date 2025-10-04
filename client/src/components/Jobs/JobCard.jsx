import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, User, Star, CheckCircle } from 'lucide-react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import AuthPrompt from '../Auth/AuthPrompt';

const JobCard = ({ 
  _id, 
  title, 
  description, 
  budget, 
  location, 
  category, 
  status, 
  createdAt, 
  creator, 
  isUrgent,
  showActions = true,
  onAccept 
}) => {
  const formatBudget = (budget) => {
    if (!budget) return 'Negotiable';
    if (budget.min === budget.max) return `$${budget.min}`;
    return `$${budget.min} - $${budget.max}`;
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
      case 'open': return 'success';
      case 'accepted': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <Card.Header>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={getStatusColor(status || 'open')} size="sm">
                {(status || 'open').replace('_', ' ').toUpperCase()}
              </Badge>
              {isUrgent && (
                <Badge variant="error" size="sm">
                  URGENT
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right ml-3">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatBudget(budget)}
            </div>
            {budget?.isNegotiable && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Negotiable
              </div>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Content>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="truncate">
              {location?.address?.city}, {location?.address?.state}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatDate(createdAt)}</span>
          </div>

          {creator && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <User className="w-4 h-4 mr-2" />
              <span className="truncate">
                {creator.firstName} {creator.lastName}
              </span>
              {creator.rating && (
                <div className="flex items-center ml-2">
                  <Star className="w-3 h-3 text-yellow-400 mr-1" />
                  <span className="text-xs">
                    {creator.rating.average?.toFixed(1)} ({creator.rating.totalReviews})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" size="sm">
            {category}
          </Badge>
          
          <div className="flex items-center gap-2">
            {creator?.verified && (
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </div>
            )}
          </div>
        </div>
      </Card.Content>
      
      {showActions && status === 'open' && (
        <Card.Footer>
          <div className="flex items-center justify-between w-full">
            <Link to={`/jobs/${_id}`} className="flex-1">
              <Button variant="outline" size="sm" fullWidth>
                View Details
              </Button>
            </Link>
            
            {onAccept && (
              <AuthPrompt requireAuth={true} promptMessage="Please sign in to accept this job">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAccept(_id)}
                  className="ml-3"
                >
                  Accept Job
                </Button>
              </AuthPrompt>
            )}
          </div>
        </Card.Footer>
      )}
    </Card>
  );
};

export default JobCard; 