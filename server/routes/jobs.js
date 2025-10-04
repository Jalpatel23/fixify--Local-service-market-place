const express = require('express');
const router = express.Router();

const jobController = require('../controllers/jobController');
const { 
  authenticateUser, 
  optionalAuth, 
  checkResourceOwnership, 
  validateSession 
} = require('../middleware/auth');
const { 
  jobValidationRules, 
  handleValidationErrors 
} = require('../utils/validation');
const { Job } = require('../models');

// Public routes (no authentication required)
router.get('/', optionalAuth, jobController.getJobs);

// Job categories endpoint (must be before /:id route)
router.get('/categories', (req, res) => {
  const categories = [
    'plumbing', 'electrical', 'carpentry', 'cleaning',
    'gardening', 'painting', 'moving', 'repair', 'other'
  ];
  res.json({ success: true, data: categories });
});

// User-specific job lists (move these above the :id route)
router.get('/my-jobs', authenticateUser, validateSession, jobController.getMyJobs);
router.get('/accepted-jobs', authenticateUser, validateSession, jobController.getAcceptedJobs);
router.get('/saved', authenticateUser, validateSession, jobController.getSavedJobs);

// Public job detail route (must be after specific routes)
router.get('/:id', optionalAuth, jobController.getJob);

// Protected routes (authentication required)
router.use('/', authenticateUser, validateSession);

// Job CRUD operations
router.post('/',
  jobValidationRules.create,
  handleValidationErrors,
  jobController.createJob
);

router.put('/:id',
  checkResourceOwnership(Job),
  jobValidationRules.update,
  handleValidationErrors,
  jobController.updateJob
);

router.delete('/:id',
  checkResourceOwnership(Job),
  jobController.deleteJob
);

// Job actions
router.post('/:id/accept', jobController.acceptJob);
router.post('/:id/complete', jobController.completeJob);
router.post('/:id/cancel', jobController.cancelJob);
router.post('/:id/reopen', jobController.reopenJob);
router.post('/:id/save', jobController.toggleJobSave);

// Job statistics endpoint
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          openJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          completedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalBudget: { $sum: '$budget.max' },
          avgBudget: { $avg: '$budget.max' }
        }
      }
    ]);

    const categoryStats = await Job.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget.max' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalJobs: 0,
          openJobs: 0,
          completedJobs: 0,
          totalBudget: 0,
          avgBudget: 0
        },
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      error: 'Failed to get job statistics',
      message: 'Internal server error'
    });
  }
});

// User job statistics
router.get('/stats/my-stats', async (req, res) => {
  try {
    const userStats = await Job.aggregate([
      {
        $match: {
          $or: [
            { creator: req.user._id },
            { assignedTo: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: null,
          postedJobs: {
            $sum: { $cond: [{ $eq: ['$creator', req.user._id] }, 1, 0] }
          },
          acceptedJobs: {
            $sum: { $cond: [{ $eq: ['$assignedTo', req.user._id] }, 1, 0] }
          },
          completedJobs: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'completed'] },
                  { $or: [
                    { $eq: ['$creator', req.user._id] },
                    { $eq: ['$assignedTo', req.user._id] }
                  ]}
                ]},
                1, 0
              ]
            }
          },
          totalEarnings: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'completed'] },
                  { $eq: ['$assignedTo', req.user._id] }
                ]},
                '$budget.max',
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: userStats[0] || {
        postedJobs: 0,
        acceptedJobs: 0,
        completedJobs: 0,
        totalEarnings: 0
      }
    });
  } catch (error) {
    console.error('Get user job stats error:', error);
    res.status(500).json({
      error: 'Failed to get user job statistics',
      message: 'Internal server error'
    });
  }
});

// Nearby jobs endpoint
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, distance = 10, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: 'Latitude and longitude are required'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistance = parseFloat(distance) * 1000; // Convert km to meters

    const jobs = await Job.find({
      status: 'open',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: maxDistance
        }
      }
    })
    .populate('creator', 'firstName lastName profileImage rating')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Get nearby jobs error:', error);
    res.status(500).json({
      error: 'Failed to get nearby jobs',
      message: 'Internal server error'
    });
  }
});

// Job search endpoint
router.get('/search', async (req, res) => {
  try {
    const { 
      q, 
      category, 
      minBudget, 
      maxBudget, 
      status,
      page = 1, 
      limit = 10 
    } = req.query;

    const filters = {};

    // Text search
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filters.category = category;
    }

    // Budget filter
    if (minBudget || maxBudget) {
      filters['budget.max'] = {};
      if (minBudget) filters['budget.max'].$gte = parseFloat(minBudget);
      if (maxBudget) filters['budget.max'].$lte = parseFloat(maxBudget);
    }

    // Status filter
    if (status) {
      filters.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filters)
      .populate('creator', 'firstName lastName profileImage rating')
      .populate('assignedTo', 'firstName lastName profileImage rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filters);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({
      error: 'Failed to search jobs',
      message: 'Internal server error'
    });
  }
});

module.exports = router; 