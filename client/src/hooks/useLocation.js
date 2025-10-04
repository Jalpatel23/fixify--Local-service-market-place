import { useState, useEffect, useCallback } from 'react';
import { getCurrentLocation, geocodeAddress, reverseGeocode } from '../utils/mapUtils';
import { storageService } from '../services/api';

const LOCATION_STORAGE_KEY = 'fixify_user_location';

export const useLocation = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Load saved location from localStorage
  useEffect(() => {
    const savedLocation = storageService.get(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      setUserLocation(savedLocation);
    }
  }, []);

  // Save location to localStorage
  const saveLocation = useCallback((location) => {
    storageService.set(LOCATION_STORAGE_KEY, location);
    setUserLocation(location);
  }, []);

  // Get current location from browser
  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      saveLocation(location);
      setPermissionGranted(true);
      return location;
    } catch (err) {
      console.error('Error getting location:', err);
      setError(err.message);
      setPermissionGranted(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveLocation]);

  // Set location manually (from address search)
  const setLocation = useCallback((location) => {
    saveLocation(location);
  }, [saveLocation]);

  // Search for location by address
  const searchLocation = useCallback(async (address) => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await geocodeAddress(address);
      saveLocation(location);
      return location;
    } catch (err) {
      console.error('Error searching location:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveLocation]);

  // Get address from coordinates
  const getAddress = useCallback(async (lat, lng) => {
    try {
      const result = await reverseGeocode(lat, lng);
      return result.formatted_address;
    } catch (err) {
      console.error('Error getting address:', err);
      return null;
    }
  }, []);

  // Clear location
  const clearLocation = useCallback(() => {
    storageService.remove(LOCATION_STORAGE_KEY);
    setUserLocation(null);
    setError(null);
  }, []);

  // Check if geolocation is supported
  const isGeolocationSupported = () => {
    return 'geolocation' in navigator;
  };

  // Request location permission
  const requestPermission = useCallback(async () => {
    if (!isGeolocationSupported()) {
      setError('Geolocation is not supported by this browser');
      return false;
    }

    try {
      await getLocation();
      return true;
    } catch (err) {
      return false;
    }
  }, [getLocation]);

  return {
    userLocation,
    isLoading,
    error,
    permissionGranted,
    getLocation,
    setLocation,
    searchLocation,
    getAddress,
    clearLocation,
    isGeolocationSupported,
    requestPermission
  };
}; 