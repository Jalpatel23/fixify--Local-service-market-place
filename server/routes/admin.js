const express = require('express');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../utils/validation');
const { authenticateUser } = require('../middleware/auth');
const { requireAdmin, requireModerator } = require('../middleware/admin');
const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getJobsForModeration,
  updateJobStatus,
  getReviewsForModeration,
  updateReviewStatus,
  getAnalytics
} = require('../controllers/adminController');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

// Dashboard statistics (admin only)
router.get('/dashboard', requireAdmin, getDashboardStats);

// User management (admin only)
router.get('/users', requireAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('role').optional().isIn(['client', 'helper', 'both']).withMessage('Invalid role'),
  handleValidationErrors
], getUsers);

router.put('/users/:userId', requireAdmin, [
  param('userId').notEmpty().withMessage('User ID is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean'),
  body('isModerator').optional().isBoolean().withMessage('isModerator must be a boolean'),
  body('adminPermissions').optional().isArray().withMessage('adminPermissions must be an array'),
  handleValidationErrors
], updateUserStatus);

// Job moderation (moderator or admin)
router.get('/jobs', requireModerator, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['open', 'accepted', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('category').optional().isString().withMessage('Category must be a string'),
  handleValidationErrors
], getJobsForModeration);

router.put('/jobs/:jobId', requireModerator, [
  param('jobId').isMongoId().withMessage('Invalid job ID'),
  body('status').isIn(['open', 'accepted', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  handleValidationErrors
], updateJobStatus);

// Review moderation (moderator or admin)
router.get('/reviews', requireModerator, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  handleValidationErrors
], getReviewsForModeration);

router.put('/reviews/:reviewId', requireModerator, [
  param('reviewId').isMongoId().withMessage('Invalid review ID'),
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  handleValidationErrors
], updateReviewStatus);

// Analytics (admin only)
router.get('/analytics', requireAdmin, [
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid period'),
  handleValidationErrors
], getAnalytics);

module.exports = router; 