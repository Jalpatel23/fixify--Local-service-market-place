import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, MapPin } from 'lucide-react';
import Input from './Input';
import Button from './Button';

const SearchBar = ({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search jobs...',
  showFilters = false,
  onFilterClick,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch?.(value);
    }
  };
  
  const handleClear = () => {
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };
  
  const handleSearch = () => {
    onSearch?.(value);
  };
  
  return (
    <div className={`relative ${className}`} {...props}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          leftIcon={<Search className="h-4 w-4" />}
          showClearButton={!!value}
          onClear={handleClear}
          className="pr-20"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFilterClick}
              className="h-8 w-8 p-0"
              title="Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleSearch}
            disabled={!value.trim()}
            className="h-8 px-3"
          >
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 