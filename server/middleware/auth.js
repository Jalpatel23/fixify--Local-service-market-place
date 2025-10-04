const { User } = require('../models');
const { createSystemNotification, verifySessionToken, syncUserData, getClerkUser } = require('../utils');

/**
 * Verify Clerk session and get user data
 * @param {string} sessionToken - Clerk session token
 * @returns {Object} User data from Clerk
 */
const verifyClerkSession = async (sessionToken) => {
  try {
    return await verifySessionToken(sessionToken);
  } catch (error) {
    console.error('Clerk session verification error:', error);
    throw new Error('Authentication failed');
  }
};

/**
 * Get or create user from database based on Clerk data
 * @param {Object} clerkData - User data from Clerk
 * @returns {Object} User document from database
 */
const getOrCreateUser = async (clerkData) => {
  try {
    const user = await syncUserData(clerkData.user);
    return user;
  } catch (error) {
    console.error('Error getting or creating user:', error);
    throw new Error('User creation failed');
  }
};

/**
 * Authentication middleware
 * Verifies Clerk session and attaches user to request
 */
const authenticateUser = async (req, res, next) => {
  try {
    // 1) If Clerk SDK middleware attached auth info, prefer that (bypasses manual token verify)
    if (req.auth && req.auth.userId) {
      const clerkUser = await getClerkUser(req.auth.userId);
      const user = await getOrCreateUser({ user: clerkUser });
      req.user = user;
      req.clerkData = { user: clerkUser, from: 'clerk-sdk' };
      return next();
    }

    // 2) Fallback: Bearer token header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No valid authorization header'
      });
    }

    const sessionToken = authHeader.substring(7);

    // Verify session with Clerk (supports JWT or session token)
    const clerkData = await verifyClerkSession(sessionToken);

    // Get or create user in database
    const user = await getOrCreateUser(clerkData);

    // Attach user to request
    req.user = user;
    req.clerkData = clerkData;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if authenticated, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Prefer Clerk SDK context when available
    if (req.auth && req.auth.userId) {
      const clerkUser = await getClerkUser(req.auth.userId);
      const user = await getOrCreateUser({ user: clerkUser });
      req.user = user;
      req.clerkData = { user: clerkUser, from: 'clerk-sdk' };
      return next();
    }

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      const clerkData = await verifyClerkSession(sessionToken);
      const user = await getOrCreateUser(clerkData);

      req.user = user;
      req.clerkData = clerkData;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.accountType)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin access
 */
const checkResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated'
        });
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          error: 'Resource not found',
          message: 'The requested resource does not exist'
        });
      }

      // Check if user owns the resource or is admin
      const isOwner = resource.creator?.toString() === req.user._id.toString();
      const isAdmin = req.user.accountType === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have permission to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify resource ownership'
      });
    }
  };
};

/**
 * Rate limiting middleware for authentication attempts
 */
const authRateLimit = (req, res, next) => {
  // This would typically use a rate limiting library like express-rate-limit
  // For now, we'll implement a basic version
  const clientIP = req.ip;
  const now = Date.now();
  
  // Simple in-memory rate limiting (in production, use Redis)
  if (!req.app.locals.authAttempts) {
    req.app.locals.authAttempts = new Map();
  }
  
  const attempts = req.app.locals.authAttempts.get(clientIP) || [];
  const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000); // 15 minutes
  
  if (recentAttempts.length >= 5) {
    return res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again later'
    });
  }
  
  recentAttempts.push(now);
  req.app.locals.authAttempts.set(clientIP, recentAttempts);
  
  next();
};

/**
 * Session validation middleware
 * Ensures user session is still valid
 */
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Session expired',
        message: 'Please log in again'
      });
    }

    // Check if user is still active
    if (!req.user.isActive) {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended'
      });
    }

    // Update last activity (optional)
    req.user.lastActivity = new Date();
    await req.user.save();

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({
      error: 'Session validation failed',
      message: 'Please try again'
    });
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
  authorizeRoles,
  checkResourceOwnership,
  authRateLimit,
  validateSession,
  verifyClerkSession,
  getOrCreateUser
}; 