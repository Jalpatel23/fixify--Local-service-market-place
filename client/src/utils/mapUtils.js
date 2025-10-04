import { config } from './config';

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Format distance for display
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Get user's current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

// Validate coordinates
export const validateCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Create a bounding box for map queries
export const createBoundingBox = (center, radiusKm) => {
  const lat = center.lat;
  const lng = center.lng;
  const latDelta = radiusKm / 111.32; // Approximate km per degree latitude
  const lngDelta = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta
  };
};

// Convert address to coordinates using Google Geocoding API
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${config.googleMapsApiKey}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formatted_address: data.results[0].formatted_address
      };
    }
    throw new Error('No results found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

// Convert coordinates to address using Google Reverse Geocoding API
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${config.googleMapsApiKey}`
    );
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return {
        formatted_address: data.results[0].formatted_address,
        components: data.results[0].address_components
      };
    }
    throw new Error('No results found');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

// Get nearby jobs within a radius
export const getNearbyJobs = (jobs, userLocation, radiusKm = 50) => {
  if (!userLocation || !jobs) return [];
  
  return jobs.filter(job => {
    const jobLocation = job.location?.coordinates;
    if (!jobLocation || jobLocation.length < 2) return false;
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      jobLocation[1],
      jobLocation[0]
    );
    
    return distance <= radiusKm;
  }).sort((a, b) => {
    const distanceA = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      a.location.coordinates[1],
      a.location.coordinates[0]
    );
    const distanceB = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      b.location.coordinates[1],
      b.location.coordinates[0]
    );
    return distanceA - distanceB;
  });
};

// Create map markers from jobs
export const createJobMarkers = (jobs) => {
  return jobs.map(job => {
    const coordinates = job.location?.coordinates;
    if (!coordinates || coordinates.length < 2) return null;

    return {
      lat: coordinates[1],
      lng: coordinates[0],
      title: job.title,
      job: job
    };
  }).filter(Boolean);
};

// Get map center from jobs or user location
export const getMapCenter = (jobs, userLocation) => {
  if (jobs && jobs.length > 0) {
    const lats = jobs.map(job => job.location?.coordinates?.[1] || 0);
    const lngs = jobs.map(job => job.location?.coordinates?.[0] || 0);
    
    const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const avgLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
    
    return { lat: avgLat, lng: avgLng };
  }
  
  if (userLocation) {
    return userLocation;
  }
  
  // Default to Gujarat, India
  return { lat: 23.0225, lng: 72.5714 };
};

// Calculate optimal zoom level based on jobs spread
export const calculateOptimalZoom = (jobs, userLocation) => {
  if (!jobs || jobs.length === 0) return 10;
  
  const locations = jobs
    .map(job => job.location?.coordinates)
    .filter(coords => coords && coords.length >= 2)
    .map(coords => ({ lat: coords[1], lng: coords[0] }));
  
  if (locations.length === 0) return 10;
  
  const lats = locations.map(loc => loc.lat);
  const lngs = locations.map(loc => loc.lng);
  
  const latSpread = Math.max(...lats) - Math.min(...lats);
  const lngSpread = Math.max(...lngs) - Math.min(...lngs);
  const maxSpread = Math.max(latSpread, lngSpread);
  
  if (maxSpread > 10) return 8;
  if (maxSpread > 5) return 10;
  if (maxSpread > 1) return 12;
  if (maxSpread > 0.1) return 14;
  return 16;
}; 