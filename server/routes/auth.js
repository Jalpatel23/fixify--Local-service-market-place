const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { 
  authenticateUser, 
  optionalAuth, 
  authorizeRoles, 
  validateSession 
} = require('../middleware/auth');
const { 
  userValidationRules, 
  handleValidationErrors 
} = require('../utils/validation');

// Public routes (no authentication required)
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

// Protected routes (authentication required)
router.use('/me', authenticateUser, validateSession);
router.get('/me', authController.getCurrentUser);

router.use('/profile', authenticateUser, validateSession);
router.put('/profile', 
  userValidationRules.update, 
  handleValidationErrors, 
  authController.updateProfile
);

router.use('/location', authenticateUser, validateSession);
router.put('/location', authController.updateLocation);

router.use('/skills', authenticateUser, validateSession);
router.put('/skills', authController.updateSkills);

router.use('/preferences', authenticateUser, validateSession);
router.put('/preferences', authController.updatePreferences);

router.use('/stats', authenticateUser, validateSession);
router.get('/stats', authController.getUserStats);

router.use('/verify', authenticateUser, validateSession);
router.post('/verify', authController.verifySession);

router.use('/refresh', authenticateUser, validateSession);
router.post('/refresh', authController.refreshSession);

// Notification routes
router.use('/notifications', authenticateUser, validateSession);
router.get('/notifications', authController.getNotifications);
router.put('/notifications/read-all', authController.markAllNotificationsRead);
router.put('/notifications/:id/read', authController.markNotificationRead);

// Account management
router.use('/account', authenticateUser, validateSession);
router.delete('/account', authController.deleteAccount);

// Role-based routes
router.use('/admin', authenticateUser, validateSession, authorizeRoles(['admin']));
router.get('/admin/users', (req, res) => {
  // Admin route for user management (to be implemented)
  res.json({ message: 'Admin user management endpoint' });
});

// Optional authentication routes (can work with or without auth)
router.use('/public', optionalAuth);
router.get('/public/profile/:userId', authController.getPublicProfile);

// Get user by ID (for messaging)
router.get('/user/:userId', authenticateUser, validateSession, authController.getUserById);

module.exports = router; 