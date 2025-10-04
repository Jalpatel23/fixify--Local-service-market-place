const express = require('express');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');
const rateLimit = require('express-rate-limit');

// Rate limit: max 10 review actions per 15 minutes per IP
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

const { authenticateUser } = require('../middleware/auth');
const {
  createReview,
  getUserReviews,
  getUserReviewStats,
  updateReview,
  deleteReview,
  markReviewHelpful,
  flagReview,
  respondToReview,
  getJobReviews
} = require('../controllers/reviewController');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Create a new review
router.post('/', reviewLimiter, [
  body('jobId').isMongoId().withMessage('Invalid job ID'),
  body('revieweeId').notEmpty().withMessage('Reviewee ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').notEmpty().withMessage('Review title is required')
    .isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('content').notEmpty().withMessage('Review content is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
  body('categories').optional().isObject().withMessage('Categories must be an object'),
  body('categories.communication').optional().isInt({ min: 1, max: 5 }),
  body('categories.quality').optional().isInt({ min: 1, max: 5 }),
  body('categories.timeliness').optional().isInt({ min: 1, max: 5 }),
  body('categories.professionalism').optional().isInt({ min: 1, max: 5 }),
  body('categories.value').optional().isInt({ min: 1, max: 5 }),
  handleValidationErrors
], createReview);

// Get reviews for a user
router.get('/user/:userId', [
  param('userId').notEmpty().withMessage('User ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'all']).withMessage('Invalid status'),
  handleValidationErrors
], getUserReviews);

// Get review statistics for a user
router.get('/user/:userId/stats', [
  param('userId').notEmpty().withMessage('User ID is required'),
  handleValidationErrors
], getUserReviewStats);

// Update a review
router.put('/:reviewId', reviewLimiter, [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('content').optional().isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
  body('categories').optional().isObject().withMessage('Categories must be an object'),
  handleValidationErrors
], updateReview);

// Delete a review
router.delete('/:reviewId', reviewLimiter, [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  handleValidationErrors
], deleteReview);

// Mark review as helpful
router.post('/:reviewId/helpful', reviewLimiter, [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('isHelpful').isBoolean().withMessage('isHelpful must be a boolean'),
  handleValidationErrors
], markReviewHelpful);

// Flag a review
router.post('/:reviewId/flag', reviewLimiter, [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('reason').isIn(['inappropriate', 'spam', 'fake', 'other']).withMessage('Invalid flag reason'),
  handleValidationErrors
], flagReview);

// Respond to a review
router.post('/:reviewId/respond', reviewLimiter, [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('content').notEmpty().withMessage('Response content is required')
    .isLength({ min: 1, max: 1000 }).withMessage('Response must be between 1 and 1000 characters'),
  handleValidationErrors
], respondToReview);

// Get reviews for a job
router.get('/job/:jobId', [
  param('jobId').isMongoId().withMessage('Invalid job ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], getJobReviews);

module.exports = router;