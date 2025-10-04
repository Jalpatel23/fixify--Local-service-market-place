const User = require('../models/User');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.clerkId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user exists and has admin role
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Add admin user to request
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Middleware to check if user is moderator or admin
const requireModerator = async (req, res, next) => {
  try {
    const userId = req.user?.clerkId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user exists and has moderator or admin role
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isAdmin && !user.isModerator) {
      return res.status(403).json({
        success: false,
        error: 'Moderator access required'
      });
    }

    // Add moderator user to request
    req.moderatorUser = user;
    next();
  } catch (error) {
    console.error('Moderator middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  requireAdmin,
  requireModerator
}; 