const { Job, User } = require('../models');
const { 
  createNearbyQuery, 
  createPagination, 
  calculateDistance,
  validateCoordinates,
  formatLocation
} = require('../utils');

/**
 * Advanced job browsing with comprehensive filtering
 * @route GET /api/browse/jobs
 */
const browseJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      status,
      minBudget,
      maxBudget,
      distance,
      latitude,
      longitude,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      skills,
      experience,
      verifiedOnly,
      urgent,
      dateRange,
      timeSlot
    } = req.query;

    // Build base filters
    const filters = {};

    // Status filter
    if (status) {
      filters.status = status;
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

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',');
      filters['requirements.skills'] = { $in: skillsArray };
    }

    // Experience filter
    if (experience && experience !== 'any') {
      filters['requirements.experience'] = experience;
    }

    // Verified only filter
    if (verifiedOnly === 'true') {
      filters['requirements.verifiedOnly'] = true;
    }

    // Urgent jobs filter
    if (urgent === 'true') {
      filters.isUrgent = true;
    }

    // Date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      if (startDate && endDate) {
        filters.preferredDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
    }

    // Text search
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Location-based filtering
    if (latitude && longitude && distance) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      if (validateCoordinates(coordinates)) {
        Object.assign(filters, createNearbyQuery(coordinates, parseFloat(distance)));
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const { data: jobs, pagination } = await createPagination(
      Job,
      filters,
      sort,
      page,
      limit,
      [
        { path: 'creator', select: 'firstName lastName profileImage rating isVerified' },
        { path: 'assignedTo', select: 'firstName lastName profileImage rating' }
      ]
    );

    // Add distance information if coordinates provided
    if (latitude && longitude) {
      const userCoords = [parseFloat(longitude), parseFloat(latitude)];
      jobs.forEach(job => {
        if (job.location && job.location.coordinates) {
          job.distance = calculateDistance(
            userCoords[1], userCoords[0],
            job.location.coordinates[1], job.location.coordinates[0]
          );
        }
      });
    }

    res.json({
      success: true,
      data: jobs,
      pagination,
      filters: {
        applied: Object.keys(filters).length,
        total: jobs.length
      }
    });
  } catch (error) {
    console.error('Browse jobs error:', error);
    res.status(500).json({
      error: 'Failed to browse jobs',
      message: 'Internal server error'
    });
  }
};

/**
 * Get job recommendations based on user skills and location
 * @route GET /api/browse/recommendations
 */
const getJobRecommendations = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be logged in for recommendations'
      });
    }

    // Build recommendation filters
    const filters = {
      status: 'open'
    };

    // Filter by user skills
    if (user.skills && user.skills.length > 0) {
      const userSkillCategories = user.skills.map(skill => skill.category);
      filters.$or = [
        { category: { $in: userSkillCategories } },
        { 'requirements.skills': { $in: userSkillCategories } }
      ];
    }

    // Filter by location if available
    if (user.location && user.location.coordinates) {
      const maxDistance = user.preferences?.maxDistance || 25;
      filters.location = createNearbyQuery(
        user.location.coordinates,
        maxDistance
      );
    }

    // Get recommended jobs
    const recommendations = await Job.find(filters)
      .populate('creator', 'firstName lastName profileImage rating isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Add relevance score
    recommendations.forEach(job => {
      job.relevanceScore = calculateRelevanceScore(job, user);
    });

    // Sort by relevance score
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      data: recommendations,
      total: recommendations.length
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: 'Internal server error'
    });
  }
};

/**
 * Get trending jobs (most viewed, saved, or recently posted)
 * @route GET /api/browse/trending
 */
const getTrendingJobs = async (req, res) => {
  try {
    const { 
      period = 'week', 
      limit = 10,
      category,
      latitude,
      longitude,
      distance
    } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build filters
    const filters = {
      status: 'open',
      createdAt: { $gte: startDate }
    };

    if (category) {
      filters.category = category;
    }

    // Location filter
    if (latitude && longitude && distance) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      if (validateCoordinates(coordinates)) {
        filters.location = createNearbyQuery(coordinates, parseFloat(distance));
      }
    }

    // Get trending jobs based on views and saves
    const trendingJobs = await Job.find(filters)
      .populate('creator', 'firstName lastName profileImage rating isVerified')
      .sort({ 'stats.views': -1, 'stats.savedBy': -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: trendingJobs,
      period,
      total: trendingJobs.length
    });
  } catch (error) {
    console.error('Get trending jobs error:', error);
    res.status(500).json({
      error: 'Failed to get trending jobs',
      message: 'Internal server error'
    });
  }
};

/**
 * Get jobs by category with statistics
 * @route GET /api/browse/category/:category
 */
const getJobsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { 
      page = 1, 
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      latitude,
      longitude,
      distance
    } = req.query;

    // Validate category
    const validCategories = [
      'plumbing', 'electrical', 'carpentry', 'cleaning', 
      'gardening', 'painting', 'moving', 'repair', 'other'
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Please provide a valid job category'
      });
    }

    // Build filters
    const filters = {
      category,
      status: 'open'
    };

    // Location filter
    if (latitude && longitude && distance) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      if (validateCoordinates(coordinates)) {
        Object.assign(filters, createNearbyQuery(coordinates, parseFloat(distance)));
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const { data: jobs, pagination } = await createPagination(
      Job,
      filters,
      sort,
      page,
      limit,
      [
        { path: 'creator', select: 'firstName lastName profileImage rating isVerified' }
      ]
    );

    // Get category statistics
    const categoryStats = await Job.aggregate([
      { $match: { category } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          openJobs: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          avgBudget: { $avg: '$budget.max' },
          totalViews: { $sum: '$stats.views' }
        }
      }
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination,
      category,
      statistics: categoryStats[0] || {
        totalJobs: 0,
        openJobs: 0,
        avgBudget: 0,
        totalViews: 0
      }
    });
  } catch (error) {
    console.error('Get jobs by category error:', error);
    res.status(500).json({
      error: 'Failed to get jobs by category',
      message: 'Internal server error'
    });
  }
};

/**
 * Search jobs with advanced filters
 * @route GET /api/browse/search
 */
const searchJobs = async (req, res) => {
  try {
    const {
      q,
      category,
      minBudget,
      maxBudget,
      location,
      radius = 25,
      skills,
      experience,
      dateFrom,
      dateTo,
      sortBy = 'relevance',
      page = 1,
      limit = 12
    } = req.query;

    // Build search filters
    const filters = {
      status: 'open'
    };

    // Text search
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
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

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',');
      filters['requirements.skills'] = { $in: skillsArray };
    }

    // Experience filter
    if (experience && experience !== 'any') {
      filters['requirements.experience'] = experience;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filters.preferredDate = {};
      if (dateFrom) filters.preferredDate.$gte = new Date(dateFrom);
      if (dateTo) filters.preferredDate.$lte = new Date(dateTo);
    }

    // Location filter
    if (location) {
      // This would typically use a geocoding service
      // For now, we'll assume location is provided as coordinates
      try {
        const coords = JSON.parse(location);
        if (validateCoordinates(coords)) {
          Object.assign(filters, createNearbyQuery(coords, parseFloat(radius)));
        }
      } catch (error) {
        console.log('Invalid location format');
      }
    }

    // Build sort object
    let sort = {};
    if (sortBy === 'relevance' && q) {
      // For text search, sort by text score
      filters.$text = { $search: q };
      sort = { score: { $meta: 'textScore' } };
    } else {
      sort[sortBy] = -1;
    }

    // Execute search
    const { data: jobs, pagination } = await createPagination(
      Job,
      filters,
      sort,
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
      searchQuery: q,
      totalResults: pagination.total
    });
  } catch (error) {
    console.error('Search jobs error:', error);
    res.status(500).json({
      error: 'Failed to search jobs',
      message: 'Internal server error'
    });
  }
};

/**
 * Get job filters and options
 * @route GET /api/browse/filters
 */
const getJobFilters = async (req, res) => {
  try {
    // Get all categories with counts
    const categoryStats = await Job.aggregate([
      { $match: { status: 'open' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgBudget: { $avg: '$budget.max' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get budget ranges
    const budgetStats = await Job.aggregate([
      { $match: { status: 'open' } },
      {
        $group: {
          _id: null,
          minBudget: { $min: '$budget.min' },
          maxBudget: { $max: '$budget.max' },
          avgBudget: { $avg: '$budget.max' }
        }
      }
    ]);

    // Get experience levels
    const experienceStats = await Job.aggregate([
      { $match: { status: 'open' } },
      {
        $group: {
          _id: '$requirements.experience',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get skills distribution
    const skillsStats = await Job.aggregate([
      { $match: { status: 'open' } },
      { $unwind: '$requirements.skills' },
      {
        $group: {
          _id: '$requirements.skills',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        categories: categoryStats,
        budget: budgetStats[0] || { minBudget: 0, maxBudget: 0, avgBudget: 0 },
        experience: experienceStats,
        skills: skillsStats
      }
    });
  } catch (error) {
    console.error('Get job filters error:', error);
    res.status(500).json({
      error: 'Failed to get job filters',
      message: 'Internal server error'
    });
  }
};

/**
 * Helper function to calculate job relevance score
 */
const calculateRelevanceScore = (job, user) => {
  let score = 0;

  // Skill match (highest weight)
  if (user.skills && job.requirements && job.requirements.skills) {
    const userSkills = user.skills.map(skill => skill.category);
    const jobSkills = job.requirements.skills;
    const skillMatches = userSkills.filter(skill => jobSkills.includes(skill));
    score += skillMatches.length * 10;
  }

  // Location proximity
  if (user.location && job.location) {
    const distance = calculateDistance(
      user.location.coordinates[1], user.location.coordinates[0],
      job.location.coordinates[1], job.location.coordinates[0]
    );
    if (distance <= 5) score += 5;
    else if (distance <= 10) score += 3;
    else if (distance <= 25) score += 1;
  }

  // Budget match
  if (user.preferences && user.preferences.maxBudget) {
    if (job.budget.max <= user.preferences.maxBudget) {
      score += 3;
    }
  }

  // Urgency bonus
  if (job.isUrgent) {
    score += 2;
  }

  // Recency bonus
  const daysSincePosted = (Date.now() - job.createdAt) / (1000 * 60 * 60 * 24);
  if (daysSincePosted <= 1) score += 2;
  else if (daysSincePosted <= 3) score += 1;

  return score;
};

module.exports = {
  browseJobs,
  getJobRecommendations,
  getTrendingJobs,
  getJobsByCategory,
  searchJobs,
  getJobFilters
}; 