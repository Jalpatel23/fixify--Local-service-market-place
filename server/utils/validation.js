const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * User validation rules
 */
const userValidationRules = {
  create: [
    body('clerkId').notEmpty().withMessage('Clerk ID is required'),
    body('firstName').notEmpty().trim().isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName').notEmpty().trim().isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email').isEmail().normalizeEmail()
      .withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone()
      .withMessage('Valid phone number is required'),
    body('location.coordinates').isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be an array of 2 numbers'),
    body('location.coordinates.*').isFloat({ min: -180, max: 180 })
      .withMessage('Valid coordinates are required'),
    body('skills').optional().isArray()
      .withMessage('Skills must be an array'),
    body('skills.*.category').optional().isIn([
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ]).withMessage('Invalid skill category'),
    body('accountType').optional().isIn(['client', 'helper', 'both'])
      .withMessage('Invalid account type')
  ],
  
  update: [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email').optional().isEmail().normalizeEmail()
      .withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone()
      .withMessage('Valid phone number is required'),
    body('location.coordinates').optional().isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be an array of 2 numbers'),
    body('location.coordinates.*').optional().isFloat({ min: -180, max: 180 })
      .withMessage('Valid coordinates are required'),
    body('preferences.maxDistance').optional().isInt({ min: 1, max: 100 })
      .withMessage('Max distance must be between 1 and 100 miles')
  ]
};

/**
 * Job validation rules
 */
const jobValidationRules = {
  create: [
    body('title').notEmpty().trim().isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description').notEmpty().trim().isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('category').isIn([
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ]).withMessage('Valid category is required'),
    body('budget.min').isFloat({ min: 1 }).withMessage('Minimum budget must be at least $1'),
    body('budget.max').isFloat({ min: 1 }).withMessage('Maximum budget must be at least $1'),
    body('location.coordinates').isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be an array of 2 numbers'),
    body('location.coordinates.*').isFloat({ min: -180, max: 180 })
      .withMessage('Valid coordinates are required'),
    body('preferredDate').isISO8601().withMessage('Valid preferred date is required'),
    body('preferredTime.start').notEmpty().withMessage('Start time is required'),
    body('preferredTime.end').notEmpty().withMessage('End time is required'),
    body('requirements.experience').optional().isIn(['any', 'beginner', 'intermediate', 'expert'])
      .withMessage('Invalid experience requirement'),
    body('requirements.skills').optional().isArray().withMessage('Skills must be an array'),
    body('requirements.skills.*').optional().isIn([
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ]).withMessage('Invalid skill in requirements'),
    body('requirements.verifiedOnly').optional().isBoolean().withMessage('verifiedOnly must be true or false'),
    body('maxDistance').optional().isInt({ min: 1, max: 100 })
      .withMessage('Max distance must be between 1 and 100 miles'),
    body('contactPreference').optional().isIn(['message', 'phone', 'email'])
      .withMessage('Invalid contact preference')
  ],
  
  update: [
    body('title').optional().trim().isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description').optional().trim().isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('category').optional().isIn([
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ]).withMessage('Valid category is required'),
    body('budget.min').optional().isFloat({ min: 1 })
      .withMessage('Minimum budget must be at least $1'),
    body('budget.max').optional().isFloat({ min: 1 })
      .withMessage('Maximum budget must be at least $1'),
    body('preferredDate').optional().isISO8601()
      .withMessage('Valid preferred date is required'),
    body('requirements.experience').optional().isIn(['any', 'beginner', 'intermediate', 'expert'])
      .withMessage('Invalid experience requirement'),
    body('requirements.skills').optional().isArray().withMessage('Skills must be an array'),
    body('requirements.skills.*').optional().isIn([
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ]).withMessage('Invalid skill in requirements'),
    body('requirements.verifiedOnly').optional().isBoolean().withMessage('verifiedOnly must be true or false'),
    body('maxDistance').optional().isInt({ min: 1, max: 100 })
      .withMessage('Max distance must be between 1 and 100 miles')
  ]
};

/**
 * Message validation rules
 */
const messageValidationRules = {
  create: [
    body('recipient').isMongoId().withMessage('Valid recipient ID is required'),
    body('content').notEmpty().trim().isLength({ min: 1, max: 2000 })
      .withMessage('Message content must be between 1 and 2000 characters'),
    body('messageType').optional().isIn(['text', 'image', 'file', 'system'])
      .withMessage('Invalid message type'),
    body('jobId').optional().isMongoId().withMessage('Valid job ID is required'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array'),
    body('attachments.*.url').optional().isURL().withMessage('Valid attachment URL is required'),
    body('attachments.*.type').optional().isIn(['image', 'document', 'video'])
      .withMessage('Invalid attachment type')
  ]
};

/**
 * Query parameter validation rules
 */
const queryValidationRules = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  
  jobFilters: [
    query('category').optional().isIn([
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ]).withMessage('Invalid category'),
    query('minBudget').optional().isFloat({ min: 0 }).withMessage('Minimum budget must be positive'),
    query('maxBudget').optional().isFloat({ min: 0 }).withMessage('Maximum budget must be positive'),
    query('dateFrom').optional().isISO8601().withMessage('Valid date format required'),
    query('dateTo').optional().isISO8601().withMessage('Valid date format required'),
    query('isUrgent').optional().isBoolean().withMessage('isUrgent must be true or false'),
    query('search').optional().trim().isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
  ],
  
  userFilters: [
    query('accountType').optional().isIn(['client', 'helper', 'both'])
      .withMessage('Invalid account type'),
    query('skills').optional().isIn([
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ]).withMessage('Invalid skill'),
    query('minRating').optional().isFloat({ min: 0, max: 5 })
      .withMessage('Minimum rating must be between 0 and 5'),
    query('verifiedOnly').optional().isBoolean().withMessage('verifiedOnly must be true or false')
  ]
};

/**
 * Parameter validation rules
 */
const paramValidationRules = {
  userId: [
    param('userId').isMongoId().withMessage('Valid user ID is required')
  ],
  
  jobId: [
    param('jobId').isMongoId().withMessage('Valid job ID is required')
  ],
  
  messageId: [
    param('messageId').isMongoId().withMessage('Valid message ID is required')
  ]
};

/**
 * Custom validation functions
 */
const customValidations = {
  /**
   * Validate budget range
   */
  validateBudgetRange: (minBudget, maxBudget) => {
    if (minBudget && maxBudget && parseFloat(minBudget) > parseFloat(maxBudget)) {
      throw new Error('Minimum budget cannot be greater than maximum budget');
    }
    return true;
  },
  
  /**
   * Validate date range
   */
  validateDateRange: (dateFrom, dateTo) => {
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      throw new Error('Start date cannot be after end date');
    }
    return true;
  },
  
  /**
   * Validate coordinates
   */
  validateCoordinates: (coordinates) => {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error('Coordinates must be an array of 2 numbers');
    }
    
    const [longitude, latitude] = coordinates;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new Error('Coordinates must be numbers');
    }
    
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    
    return true;
  }
};

module.exports = {
  handleValidationErrors,
  userValidationRules,
  jobValidationRules,
  messageValidationRules,
  queryValidationRules,
  paramValidationRules,
  customValidations
}; 