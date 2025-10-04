import React, { useState, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import Map from './Map';
import Input from '../UI/Input';
import Button from '../UI/Button';
import { geocodingService } from '../../services/api';

const LocationPicker = ({
  value = null,
  onChange,
  placeholder = 'Enter address or click on map',
  className = '',
  ...props
}) => {
  // Helper function to format address consistently
  const formatAddress = (address) => {
    if (typeof address === 'string') {
      return address;
    } else if (typeof address === 'object' && address.street) {
      const { street, city, state, zipCode, country } = address;
      return `${street}, ${city}, ${state} ${zipCode}, ${country}`;
    }
    return '';
  };
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (value) {
      setCoordinates(value);
      if (value.address) {
        setAddress(formatAddress(value.address));
      }
    }
  }, [value]);

  const handleAddressSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await geocodingService.searchAddress(searchTerm);
      setSuggestions(results.slice(0, 5));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching address:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSelect = (suggestion) => {
    setAddress(suggestion.formatted_address);
    setCoordinates({
      lat: suggestion.geometry.location.lat,
      lng: suggestion.geometry.location.lng,
      address: suggestion.formatted_address
    });
    setShowSuggestions(false);
    setSuggestions([]);
    onChange?.({
      lat: suggestion.geometry.location.lat,
      lng: suggestion.geometry.location.lng,
      address: suggestion.formatted_address
    });
  };

  const handleMapClick = async (latLng) => {
    try {
      const result = await geocodingService.reverseGeocode(latLng.lat, latLng.lng);
      const address = result.formatted_address;
      
      setAddress(address);
      setCoordinates({
        lat: latLng.lat,
        lng: latLng.lng,
        address
      });
      onChange?.({
        lat: latLng.lat,
        lng: latLng.lng,
        address
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      // Still set coordinates even if address lookup fails
      setCoordinates({
        lat: latLng.lat,
        lng: latLng.lng
      });
      onChange?.({
        lat: latLng.lat,
        lng: latLng.lng
      });
    }
  };

  const handleClear = () => {
    setAddress('');
    setCoordinates(null);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.(null);
  };

  const markers = coordinates ? [{
    lat: coordinates.lat,
    lng: coordinates.lng,
    title: 'Selected Location'
  }] : [];

  return (
    <div className={className} {...props}>
      {/* Address Input */}
      <div className="relative mb-4">
        <Input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            handleAddressSearch(e.target.value);
          }}
          placeholder={placeholder}
          leftIcon={<MapPin className="h-4 w-4" />}
          rightIcon={coordinates && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        />
        
        {/* Address Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg mt-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleAddressSelect(suggestion)}
                className="w-full text-left px-4 py-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 text-sm"
              >
                <div className="font-medium">{suggestion.formatted_address}</div>
                {suggestion.types && (
                  <div className="text-xs text-secondary-500">
                    {suggestion.types[0]}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <Map
        center={coordinates || { lat: 23.0225, lng: 72.5714 }}
        zoom={coordinates ? 15 : 10}
        markers={markers}
        onMapClick={handleMapClick}
        height="300px"
        className="rounded-lg border border-secondary-200 dark:border-secondary-700"
      />

      {/* Selected Location Info */}
      {coordinates && (
        <div className="mt-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary-500" />
            <span className="font-medium">Selected Location:</span>
          </div>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
            {typeof address === 'string' ? address : `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 