import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { config, apiEndpoints } from '../utils/config';

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const { getToken } = useAuth();
      const token = await getToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          toast.error('Please log in to continue');
          break;
        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action');
          break;
        case 404:
          // Not found
          toast.error('The requested resource was not found');
          break;
        case 422:
          // Validation error
          if (data.errors) {
            Object.values(data.errors).forEach(error => {
              toast.error(error);
            });
          } else {
            toast.error(data.message || 'Validation error');
          }
          break;
        case 429:
          // Rate limited
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data.message || 'An error occurred');
      }
    } else {
      // Network error
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const apiService = {
  // Health check
  health: () => api.get(apiEndpoints.health),
  
  // Auth endpoints
  auth: {
    me: () => api.get(apiEndpoints.auth.me),
    updateProfile: (data) => api.put(apiEndpoints.auth.profile, data),
    getStats: () => api.get(apiEndpoints.auth.stats),
    getNotifications: (params) => api.get(apiEndpoints.auth.notifications, { params }),
    markNotificationRead: (id) => api.put(`${apiEndpoints.auth.notifications}/${id}/read`),
    markAllNotificationsRead: () => api.put(`${apiEndpoints.auth.notifications}/read-all`),
  },
  
  // Jobs endpoints
  jobs: {
    list: (params) => api.get(apiEndpoints.jobs.list, { params }),
    create: (data) => api.post(apiEndpoints.jobs.create, data),
    getById: (id) => api.get(apiEndpoints.jobs.detail(id)),
    update: (id, data) => api.put(apiEndpoints.jobs.update(id), data),
    delete: (id) => api.delete(apiEndpoints.jobs.delete(id)),
    accept: (id) => api.post(apiEndpoints.jobs.accept(id)),
    complete: (id, data) => api.post(apiEndpoints.jobs.complete(id), data),
    cancel: (id, data) => api.post(apiEndpoints.jobs.cancel(id), data),
    save: (id) => api.post(apiEndpoints.jobs.save(id)),
    myJobs: (params) => api.get(apiEndpoints.jobs.myJobs, { params }),
    acceptedJobs: (params) => api.get(apiEndpoints.jobs.acceptedJobs, { params }),
    savedJobs: (params) => api.get(apiEndpoints.jobs.savedJobs, { params }),
    categories: () => api.get(apiEndpoints.jobs.categories),
    stats: () => api.get(apiEndpoints.jobs.stats),
    myStats: () => api.get(apiEndpoints.jobs.myStats),
    nearby: (params) => api.get(apiEndpoints.jobs.nearby, { params }),
    search: (params) => api.get(apiEndpoints.jobs.search, { params }),
  },
  
  // Browse endpoints
  browse: {
    jobs: (params) => api.get(apiEndpoints.browse.jobs, { params }),
    recommendations: (params) => api.get(apiEndpoints.browse.recommendations, { params }),
    trending: (params) => api.get(apiEndpoints.browse.trending, { params }),
    category: (category, params) => api.get(apiEndpoints.browse.category(category), { params }),
    search: (params) => api.get(apiEndpoints.browse.search, { params }),
    filters: () => api.get(apiEndpoints.browse.filters),
    stats: () => api.get(apiEndpoints.browse.stats),
    map: (params) => api.get(apiEndpoints.browse.map, { params }),
    saved: (params) => api.get(apiEndpoints.browse.saved, { params }),
    nearby: (params) => api.get(apiEndpoints.browse.nearby, { params }),
    urgent: (params) => api.get(apiEndpoints.browse.urgent, { params }),
  },
};

// Upload service for images
export const uploadService = {
  image: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  multipleImages: async (files) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Geocoding service
export const geocodingService = {
  // Using Google Geocoding API
  geocode: async (address) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${config.googleMapsApiKey}`
    );
    return response.json();
  },
  
  // Reverse geocoding
  reverseGeocode: async (lat, lng) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${config.googleMapsApiKey}`
    );
    const data = await response.json();
    return data.results[0] || null;
  },

  // Search address with autocomplete-like functionality
  searchAddress: async (query) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${config.googleMapsApiKey}`
    );
    const data = await response.json();
    return data.results || [];
  },
};

// Local storage service
export const storageService = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Cache service for API responses
export const cacheService = {
  cache: new Map(),
  
  get: (key) => {
    const item = cacheService.cache.get(key);
    if (item && Date.now() - item.timestamp < item.ttl) {
      return item.data;
    }
    cacheService.cache.delete(key);
    return null;
  },
  
  set: (key, data, ttl = 5 * 60 * 1000) => {
    cacheService.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },
  
  clear: () => {
    cacheService.cache.clear();
  },
  
  // Clear expired cache entries
  cleanup: () => {
    const now = Date.now();
    for (const [key, item] of cacheService.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        cacheService.cache.delete(key);
      }
    }
  },
};

// Utility functions
export const apiUtils = {
  // Create query string from object
  createQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  },
  
  // Parse query string to object
  parseQueryString: (queryString) => {
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  },
  
  // Debounce function for API calls
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Retry function for failed API calls
  retry: async (fn, retries = 3, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return apiUtils.retry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  },
};

export default api; 