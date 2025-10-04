import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from './Card';

const StatsCard = ({
  title,
  value,
  change,
  changeType = 'number', // 'number' or 'percentage'
  trend = 'up', // 'up', 'down', or 'neutral'
  icon,
  className = '',
  ...props
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600';
    if (trend === 'down') return 'text-error-600';
    return 'text-secondary-600';
  };
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return null;
  };
  
  const formatChange = () => {
    if (!change) return null;
    
    const prefix = change > 0 ? '+' : '';
    if (changeType === 'percentage') {
      return `${prefix}${change}%`;
    }
    return `${prefix}${change}`;
  };
  
  return (
    <Card className={className} {...props}>
      <Card.Content>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              {value}
            </p>
            {change && (
              <div className={`flex items-center gap-1 mt-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {formatChange()}
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

export default StatsCard;
export { StatsCard }; 