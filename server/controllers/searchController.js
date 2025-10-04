const Job = require('../models/Job');
const { handleValidationErrors } = require('../utils/validation');
const { query } = require('express-validator');

// Validation rules
const searchValidation = [
  query('q').optional().isString().withMessage('Search query must be a string'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('minBudget').optional().isNumeric().withMessage('Min budget must be a number'),
  query('maxBudget').optional().isNumeric().withMessage('Max budget must be a number'),
  query('status').optional().isIn(['open', 'accepted', 'in_progress', 'completed']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['relevance', 'date', 'budget', 'distance']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  handleValidationErrors
];

const advancedSearch = async (req, res) => {
  try {
    const {
      q = '',
      category,
      minBudget,
      maxBudget,
      status = 'open',
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      radius = 50,
      userLat,
      userLng
    } = req.query;

    const userId = req.user?.id;

    // Build query
    const query = { status };

    if (category) {
      query.category = category;
    }

    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseFloat(minBudget);
      if (maxBudget) query.budget.$lte = parseFloat(maxBudget);
    }

    // Text search
    if (q.trim()) {
      query.$text = { $search: q };
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'relevance':
        if (q.trim()) {
          sortOptions.score = { $meta: 'textScore' };
        }
        break;
      case 'date':
        sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'budget':
        sortOptions.budget = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    // Location-based search
    let jobs;
    if (userLat && userLng && radius) {
      jobs = await Job.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(userLng), parseFloat(userLat)]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        }
      })
      .populate('creator', 'firstName lastName email rating verified avatar')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    } else {
      jobs = await Job.find(query)
        .populate('creator', 'firstName lastName email rating verified avatar')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    const total = await Job.countDocuments(query);

    // Add computed fields
    const jobsWithComputedFields = jobs.map(job => {
      const jobObj = job.toObject();
      jobObj.isSaved = jobObj.savedBy?.includes(userId) || false;
      jobObj.timeAgo = Math.floor((Date.now() - new Date(job.createdAt)) / (1000 * 60 * 60));
      return jobObj;
    });

    res.json({
      jobs: jobsWithComputedFields,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};

const searchSuggestions = async (req, res) => {
  try {
    const { q, type = 'jobs' } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    let suggestions = [];

    if (type === 'jobs') {
      const jobSuggestions = await Job.find({
        title: { $regex: q, $options: 'i' },
        status: 'open'
      })
      .select('title category')
      .limit(5);

      suggestions = jobSuggestions.map(job => ({
        type: 'job',
        text: job.title,
        category: job.category
      }));
    } else if (type === 'categories') {
      const categories = await Job.distinct('category', {
        category: { $regex: q, $options: 'i' },
        status: 'open'
      });

      suggestions = categories.slice(0, 5).map(category => ({
        type: 'category',
        text: category
      }));
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
};

const getSearchFilters = async (req, res) => {
  try {
    // Get available categories
    const categories = await Job.aggregate([
      { $match: { status: 'open' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get budget range
    const budgetRange = await Job.aggregate([
      { $match: { status: 'open' } },
      {
        $group: {
          _id: null,
          minBudget: { $min: '$budget' },
          maxBudget: { $max: '$budget' },
          avgBudget: { $avg: '$budget' }
        }
      }
    ]);

    // Get popular tags
    const popularTags = await Job.aggregate([
      { $match: { status: 'open' } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      categories: categories.map(cat => ({
        value: cat._id,
        label: cat._id,
        count: cat.count
      })),
      budgetRange: budgetRange[0] || {
        minBudget: 0,
        maxBudget: 1000,
        avgBudget: 500
      },
      popularTags: popularTags.map(tag => ({
        value: tag._id,
        label: tag._id,
        count: tag.count
      }))
    });
  } catch (error) {
    console.error('Get search filters error:', error);
    res.status(500).json({ message: 'Failed to get filters' });
  }
};

module.exports = {
  advancedSearch,
  searchSuggestions,
  getSearchFilters,
  searchValidation
}; 