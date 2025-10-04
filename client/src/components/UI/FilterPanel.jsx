import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Badge from './Badge';
import { jobCategories } from '../../utils/config';

const FilterPanel = ({
  filters = {},
  onFiltersChange,
  onClearFilters,
  className = '',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleFilterChange = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };
  
  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };
  
  return (
    <div className={className} {...props}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        {getActiveFiltersCount() > 0 && (
          <Badge variant="primary" size="sm">
            {getActiveFiltersCount()}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 mt-2">
          <div className="space-y-4">
            <Input
              placeholder="Search jobs..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {jobCategories.slice(0, 6).map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleFilterChange('category', 
                      filters.category === category.value ? '' : category.value
                    )}
                    className={`p-2 rounded border text-sm ${
                      filters.category === category.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200'
                    }`}
                  >
                    {category.icon} {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel; 