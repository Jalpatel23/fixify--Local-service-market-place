// Environment variables
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  appName: import.meta.env.VITE_APP_NAME || 'Fixify',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  
  // Authentication
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  
  // Maps
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
  mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  
  // Cloudinary
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  
  // Feature Flags
  enableDarkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

// Clerk configuration
export const clerkPublishableKey = config.clerkPublishableKey;

// API endpoints
export const apiEndpoints = {
  // Auth
  auth: {
    me: '/auth/me',
    profile: '/auth/profile',
    stats: '/auth/stats',
    notifications: '/auth/notifications',
  },
  
  // Jobs
  jobs: {
    list: '/jobs',
    create: '/jobs',
    detail: (id) => `/jobs/${id}`,
    update: (id) => `/jobs/${id}`,
    delete: (id) => `/jobs/${id}`,
    accept: (id) => `/jobs/${id}/accept`,
    complete: (id) => `/jobs/${id}/complete`,
    cancel: (id) => `/jobs/${id}/cancel`,
    reopen: (id) => `/jobs/${id}/reopen`,
    save: (id) => `/jobs/${id}/save`,
    myJobs: '/jobs/my-jobs',
    acceptedJobs: '/jobs/accepted-jobs',
    savedJobs: '/jobs/saved',
    categories: '/jobs/categories',
    stats: '/jobs/stats/overview',
    myStats: '/jobs/stats/my-stats',
    nearby: '/jobs/nearby',
    search: '/jobs/search',
  },
  
  // Browse
  browse: {
    jobs: '/browse/jobs',
    recommendations: '/browse/recommendations',
    trending: '/browse/trending',
    category: (category) => `/browse/category/${category}`,
    search: '/browse/search',
    filters: '/browse/filters',
    stats: '/browse/stats',
    map: '/browse/map',
    saved: '/browse/saved',
    nearby: '/browse/nearby',
    urgent: '/browse/urgent',
  },
  
  // Health
  health: '/health',
};

// Job categories
export const jobCategories = [
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'carpentry', label: 'Carpentry', icon: '🔨' },
  { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { value: 'gardening', label: 'Gardening', icon: '🌱' },
  { value: 'painting', label: 'Painting', icon: '🎨' },
  { value: 'moving', label: 'Moving', icon: '📦' },
  { value: 'repair', label: 'Repair', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📋' },
];

// Job status options
export const jobStatusOptions = [
  { value: 'open', label: 'Open', color: 'success' },
  { value: 'accepted', label: 'Accepted', color: 'primary' },
  { value: 'in_progress', label: 'In Progress', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

// Experience levels
export const experienceLevels = [
  { value: 'any', label: 'Any Experience' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

// Sort options
export const sortOptions = [
  { value: 'createdAt', label: 'Latest' },
  { value: 'budget.max', label: 'Highest Budget' },
  { value: 'budget.min', label: 'Lowest Budget' },
  { value: 'preferredDate', label: 'Date' },
  { value: 'stats.views', label: 'Most Viewed' },
];

// Pagination
export const paginationConfig = {
  defaultPageSize: 12,
  pageSizeOptions: [6, 12, 24, 48],
};

// Map configuration
export const mapConfig = {
  defaultZoom: 12,
  defaultCenter: { lat: 40.7128, lng: -74.0060 }, // New York
  maxZoom: 18,
  minZoom: 8,
};

// Validation rules
export const validationRules = {
  job: {
    title: {
      minLength: 5,
      maxLength: 100,
    },
    description: {
      minLength: 20,
      maxLength: 2000,
    },
    budget: {
      min: 1,
      max: 10000,
    },
  },
  user: {
    firstName: {
      minLength: 2,
      maxLength: 50,
    },
    lastName: {
      minLength: 2,
      maxLength: 50,
    },
    phone: {
      pattern: /^\+?[\d\s\-\(\)]+$/,
    },
  },
};

// Local storage keys
export const storageKeys = {
  theme: 'fixify-theme',
  userPreferences: 'fixify-user-preferences',
  recentSearches: 'fixify-recent-searches',
  savedFilters: 'fixify-saved-filters',
};

// Error messages
export const errorMessages = {
  network: 'Network error. Please check your connection.',
  unauthorized: 'You must be logged in to perform this action.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  serverError: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  unknown: 'An unexpected error occurred.',
};

// Success messages
export const successMessages = {
  jobCreated: 'Job posted successfully!',
  jobUpdated: 'Job updated successfully!',
  jobDeleted: 'Job deleted successfully!',
  jobAccepted: 'Job accepted successfully!',
  jobCompleted: 'Job completed successfully!',
  jobSaved: 'Job saved successfully!',
  profileUpdated: 'Profile updated successfully!',
  settingsSaved: 'Settings saved successfully!',
};

// App constants
export const constants = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxImagesPerJob: 5,
  maxDescriptionLength: 2000,
  maxTitleLength: 100,
  defaultRadius: 25, // miles
  maxRadius: 100, // miles
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

// Storage service
export const storageService = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from localStorage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting to localStorage:', error);
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

// Default export
export default config; 