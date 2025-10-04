const express = require('express');
const router = express.Router();

const browseController = require('../controllers/browseController');
const { 
  authenticateUser, 
  optionalAuth, 
  validateSession 
} = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/jobs', optionalAuth, browseController.browseJobs);
router.get('/trending', optionalAuth, browseController.getTrendingJobs);
router.get('/category/:category', optionalAuth, browseController.getJobsByCategory);
router.get('/search', optionalAuth, browseController.searchJobs);
router.get('/filters', optionalAuth, browseController.getJobFilters);

// Protected routes (authentication required)
router.use('/recommendations', authenticateUser, validateSession);
router.get('/recommendations', browseController.getJobRecommendations);

// Browse statistics endpoint
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const { Job } = require('../models');

    // Get overall statistics
    const overallStats = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          openJobs: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          completedJobs: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalBudget: { $sum: '$budget.max' },
          avgBudget: { $avg: '$budget.max' },
          totalViews: { $sum: '$stats.views' }
        }
      }
    ]);

    // Get category distribution
    const categoryDistribution = await Job.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget.max' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity
    const recentActivity = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          jobsPosted: { $sum: 1 },
          totalBudget: { $sum: '$budget.max' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);

    // Get top locations
    const topLocations = await Job.aggregate([
      {
        $match: {
          'location.address.city': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.address.city',
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget.max' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalJobs: 0,
          openJobs: 0,
          completedJobs: 0,
          totalBudget: 0,
          avgBudget: 0,
          totalViews: 0
        },
        categories: categoryDistribution,
        recentActivity,
        topLocations
      }
    });
  } catch (error) {
    console.error('Get browse stats error:', error);
    res.status(500).json({
      error: 'Failed to get browse statistics',
      message: 'Internal server error'
    });
  }
});

// Browse map endpoint for map view
router.get('/map', optionalAuth, async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 25,
      category,
      minBudget,
      maxBudget
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required for map view'
      });
    }

    const { Job } = require('../models');
    const { createNearbyQuery, validateCoordinates } = require('../utils');

    // Build filters
    const filters = {
      status: 'open'
    };

    // Location filter
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    if (validateCoordinates(coordinates)) {
      filters.location = createNearbyQuery(coordinates, parseFloat(radius));
    }

    // Category filter
    if (category) {
      filters.category = category;
    }

    // Budget filters
    if (minBudget || maxBudget) {
      filters['budget.max'] = {};
      if (minBudget) filters['budget.max'].$gte = parseFloat(minBudget);
      if (maxBudget) filters['budget.max'].$lte = parseFloat(maxBudget);
    }

    // Get jobs for map
    const mapJobs = await Job.find(filters)
      .populate('creator', 'firstName lastName profileImage rating')
      .select('title category budget location preferredDate isUrgent stats')
      .limit(100);

    // Format jobs for map display
    const mapData = mapJobs.map(job => ({
      id: job._id,
      title: job.title,
      category: job.category,
      budget: job.budget,
      location: job.location,
      preferredDate: job.preferredDate,
      isUrgent: job.isUrgent,
      views: job.stats.views,
      creator: job.creator
    }));

    res.json({
      success: true,
      data: mapData,
      total: mapData.length,
      center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      radius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Get map jobs error:', error);
    res.status(500).json({
      error: 'Failed to get map jobs',
      message: 'Internal server error'
    });
  }
});

// Browse saved jobs endpoint
router.get('/saved', authenticateUser, validateSession, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const { Job, User } = require('../models');
    const { createPagination } = require('../utils');

    // Get user's saved jobs
    const user = await User.findById(req.user._id).populate('savedJobs');
    const savedJobIds = user.savedJobs.map(job => job._id);

    if (savedJobIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      });
    }

    // Get saved jobs with pagination
    const { data: jobs, pagination } = await createPagination(
      Job,
      { _id: { $in: savedJobIds } },
      { createdAt: -1 },
      page,
      limit,
      [
        { path: 'creator', select: 'firstName lastName profileImage rating isVerified' },
        { path: 'assignedTo', select: 'firstName lastName profileImage rating' }
      ]
    );

    res.json({
      success: true,
      data: jobs,
      pagination
    });
  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      error: 'Failed to get saved jobs',
      message: 'Internal server error'
    });
  }
});

// Browse nearby jobs endpoint
router.get('/nearby', optionalAuth, async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 10,
      limit = 20,
      category
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required'
      });
    }

    const { Job } = require('../models');
    const { createNearbyQuery, validateCoordinates, calculateDistance } = require('../utils');

    // Build filters
    const filters = {
      status: 'open'
    };

    // Location filter
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    if (validateCoordinates(coordinates)) {
      filters.location = createNearbyQuery(coordinates, parseFloat(radius));
    }

    // Category filter
    if (category) {
      filters.category = category;
    }

    // Get nearby jobs
    const nearbyJobs = await Job.find(filters)
      .populate('creator', 'firstName lastName profileImage rating isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Add distance information
    nearbyJobs.forEach(job => {
      if (job.location && job.location.coordinates) {
        job.distance = calculateDistance(
          coordinates[1], coordinates[0],
          job.location.coordinates[1], job.location.coordinates[0]
        );
      }
    });

    // Sort by distance
    nearbyJobs.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    res.json({
      success: true,
      data: nearbyJobs,
      total: nearbyJobs.length,
      center: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      radius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Get nearby jobs error:', error);
    res.status(500).json({
      error: 'Failed to get nearby jobs',
      message: 'Internal server error'
    });
  }
});

// Browse urgent jobs endpoint
router.get('/urgent', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12,
      category,
      latitude,
      longitude,
      radius
    } = req.query;

    const { Job } = require('../models');
    const { createPagination, createNearbyQuery, validateCoordinates } = require('../utils');

    // Build filters
    const filters = {
      status: 'open',
      isUrgent: true
    };

    // Category filter
    if (category) {
      filters.category = category;
    }

    // Location filter
    if (latitude && longitude && radius) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      if (validateCoordinates(coordinates)) {
        filters.location = createNearbyQuery(coordinates, parseFloat(radius));
      }
    }

    // Get urgent jobs with pagination
    const { data: jobs, pagination } = await createPagination(
      Job,
      filters,
      { createdAt: -1 },
      page,
      limit,
      [
        { path: 'creator', select: 'firstName lastName profileImage rating isVerified' }
      ]
    );

    res.json({
      success: true,
      data: jobs,
      pagination,
      total: jobs.length
    });
  } catch (error) {
    console.error('Get urgent jobs error:', error);
    res.status(500).json({
      error: 'Failed to get urgent jobs',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 