const { User, Notification } = require('../models');
const { createSystemNotification, createJobNotification } = require('../utils');
const { userValidationRules, handleValidationErrors } = require('../utils/validation');

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-__v');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      location,
      skills,
      preferences,
      accountType
    } = req.body;

    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (skills) updateData.skills = skills;
    if (preferences) updateData.preferences = preferences;
    if (accountType) updateData.accountType = accountType;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Internal server error'
    });
  }
};

/**
 * Update user location
 * @route PUT /api/auth/location
 */
const updateLocation = async (req, res) => {
  try {
    const { coordinates, address } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        error: 'Invalid coordinates',
        message: 'Coordinates must be an array of 2 numbers [longitude, latitude]'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates,
          address: address || {}
        }
      },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      data: user,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      error: 'Failed to update location',
      message: 'Internal server error'
    });
  }
};

/**
 * Update user skills
 * @route PUT /api/auth/skills
 */
const updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        error: 'Invalid skills format',
        message: 'Skills must be an array'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { skills },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      data: user,
      message: 'Skills updated successfully'
    });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({
      error: 'Failed to update skills',
      message: 'Internal server error'
    });
  }
};

/**
 * Update user preferences
 * @route PUT /api/auth/preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      data: user,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: 'Internal server error'
    });
  }
};

/**
 * Delete user account
 * @route DELETE /api/auth/account
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // In a real implementation, you would verify the password with Clerk
    // For now, we'll just deactivate the account
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user statistics
 * @route GET /api/auth/stats
 */
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('stats rating');

    res.json({
      success: true,
      data: {
        stats: user.stats,
        rating: user.rating
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to get user statistics',
      message: 'Internal server error'
    });
  }
};

/**
 * Verify user session
 * @route POST /api/auth/verify
 */
const verifySession = async (req, res) => {
  try {
    // The session is already verified by the middleware
    // This endpoint just confirms the session is valid
    res.json({
      success: true,
      data: {
        user: req.user,
        sessionValid: true
      }
    });
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({
      error: 'Session verification failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Refresh user session
 * @route POST /api/auth/refresh
 */
const refreshSession = async (req, res) => {
  try {
    // Update last activity
    await User.findByIdAndUpdate(req.user._id, {
      lastActivity: new Date()
    });

    res.json({
      success: true,
      message: 'Session refreshed successfully'
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(500).json({
      error: 'Session refresh failed',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user notifications
 * @route GET /api/auth/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: 'Internal server error'
    });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/auth/notifications/:id/read
 */
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'Notification does not exist'
      });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: 'Internal server error'
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/auth/notifications/read-all
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Failed to mark notifications as read',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user by ID (for messaging)
 * @route GET /api/auth/user/:userId
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('firstName lastName profileImage email clerkId accountType');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'Internal server error'
    });
  }
};

/**
 * Get public profile
 * @route GET /api/auth/public/profile/:userId
 */
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('firstName lastName profileImage accountType rating stats createdAt');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCurrentUser,
  updateProfile,
  updateLocation,
  updateSkills,
  updatePreferences,
  deleteAccount,
  getUserStats,
  verifySession,
  refreshSession,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUserById,
  getPublicProfile
};