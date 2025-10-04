const { User, Job, Message, Notification } = require('../models');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Create geospatial query for finding nearby jobs/users
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} maxDistance - Maximum distance in kilometers
 * @returns {Object} MongoDB geospatial query
 */
const createNearbyQuery = (coordinates, maxDistanceKm = 40) => {
  const [longitude, latitude] = Array.isArray(coordinates) ? coordinates : [coordinates.lng, coordinates.lat];
  return {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistanceKm * 1000 // kilometers to meters
      }
    }
  };
};

/**
 * Create paginated query results helper OR return skip/limit
 * Overloaded:
 *  - async createPagination(Model, filters, sort, page, limit, populate?) => { data, pagination }
 *  - createPagination(page, limit) => { skip, limit, page }
 */
const createPagination = async (...args) => {
  // Query helper signature
  if (args.length >= 5 && typeof args[0] === 'function') {
    const [Model, filters = {}, sort = {}, page = 1, limit = 10, populate = []] = args;
    const skip = (page - 1) * limit;

    let query = Model.find(filters).sort(sort).skip(skip).limit(parseInt(limit));
    if (Array.isArray(populate)) {
      populate.forEach((p) => { query = query.populate(p); });
    }

    const [data, total] = await Promise.all([
      query.exec(),
      Model.countDocuments(filters)
    ]);

    return {
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  // Simple helper signature
  const [page = 1, limit = 10] = args;
  const skip = (page - 1) * limit;
  return { skip, limit, page };
};

/**
 * Create filter query for jobs
 * @param {Object} filters - Filter parameters
 * @returns {Object} MongoDB filter query
 */
const createJobFilters = (filters = {}) => {
  const query = {};

  // Only filter by status if explicitly requested
  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.minBudget || filters.maxBudget) {
    query.budget = {};
    if (filters.minBudget) query.budget.$gte = filters.minBudget;
    if (filters.maxBudget) query.budget.$lte = filters.maxBudget;
  }
  
  if (filters.dateFrom) {
    query.preferredDate = { $gte: new Date(filters.dateFrom) };
  }
  
  if (filters.dateTo) {
    if (query.preferredDate) {
      query.preferredDate.$lte = new Date(filters.dateTo);
    } else {
      query.preferredDate = { $lte: new Date(filters.dateTo) };
    }
  }
  
  if (filters.isUrgent !== undefined) {
    query.isUrgent = filters.isUrgent;
  }
  
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { tags: { $in: [new RegExp(filters.search, 'i')] } }
    ];
  }
  
  return query;
};

/**
 * Create filter query for users
 * @param {Object} filters - Filter parameters
 * @returns {Object} MongoDB filter query
 */
const createUserFilters = (filters = {}) => {
  const query = { isActive: true };
  
  if (filters.accountType) {
    query.accountType = { $in: filters.accountType.split(',') };
  }
  
  if (filters.skills) {
    query['skills.category'] = { $in: filters.skills.split(',') };
  }
  
  if (filters.minRating) {
    query['rating.average'] = { $gte: parseFloat(filters.minRating) };
  }
  
  if (filters.verifiedOnly) {
    query.isVerified = true;
  }
  
  return query;
};

/**
 * Update user statistics
 * @param {string} userId - User ID
 * @param {string} statType - Type of statistic to update
 * @param {number} increment - Amount to increment
 */
const updateUserStats = async (userId, statType, increment = 1) => {
  const updateField = `stats.${statType}`;
  await User.findByIdAndUpdate(userId, {
    $inc: { [updateField]: increment }
  });
};

/**
 * Update job statistics
 * @param {string} jobId - Job ID
 * @param {string} statType - Type of statistic to update
 * @param {number} increment - Amount to increment
 */
const updateJobStats = async (jobId, statType, increment = 1) => {
  const updateField = `stats.${statType}`;
  await Job.findByIdAndUpdate(jobId, {
    $inc: { [updateField]: increment }
  });
};

/**
 * Create notification for job events
 * @param {string} recipientId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} jobId - Related job ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
const createJobNotification = async (recipientId, type, jobId, title, message) => {
  await Notification.createJobNotification(recipientId, type, jobId, title, message);
};

/**
 * Create system notification
 * @param {string} recipientId - Recipient user ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
const createSystemNotification = async (recipientId, type, title, message) => {
  await Notification.createSystemNotification(recipientId, type, title, message);
};

/**
 * Validate coordinates
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {boolean} True if coordinates are valid
 */
const validateCoordinates = (a, b) => {
  let lat, lng;
  if (Array.isArray(a) && a.length === 2) {
    // Accept [lng, lat]
    [lng, lat] = a;
  } else if (typeof a === 'object' && a !== null && 'lat' in a && 'lng' in a) {
    ({ lat, lng } = a);
  } else {
    lat = a; lng = b;
  }
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

/**
 * Format location for display
 * @param {Object} location - Location object
 * @returns {string} Formatted location string
 */
const formatLocation = (location) => {
  if (!location || !location.address) return 'Location not set';
  
  const addr = location.address;
  if (addr.city && addr.state) {
    return `${addr.city}, ${addr.state}`;
  } else if (addr.city) {
    return addr.city;
  } else if (addr.state) {
    return addr.state;
  }
  
  return 'Location not set';
};

module.exports = {
  calculateDistance,
  createNearbyQuery,
  createPagination,
  createJobFilters,
  createUserFilters,
  updateUserStats,
  updateJobStats,
  createJobNotification,
  createSystemNotification,
  validateCoordinates,
  formatLocation
}; 