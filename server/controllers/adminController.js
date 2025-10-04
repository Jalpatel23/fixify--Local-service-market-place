const User = require('../models/User');
const Job = require('../models/Job');
const Review = require('../models/Review');
const Message = require('../models/Message');
const { createSystemNotification, createJobNotification } = require('../utils/database');

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalReviews,
      totalMessages,
      activeUsers,
      completedJobs,
      pendingReviews,
      recentJobs
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Review.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ isActive: true }),
      Job.countDocuments({ status: 'completed' }),
      Review.countDocuments({ status: 'pending' }),
      Job.find().sort({ createdAt: -1 }).limit(5).populate('creator', 'firstName lastName')
    ]);

    // Get user growth over time
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get job statistics by category
    const jobStatsByCategory = await Job.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalJobs,
          totalReviews,
          totalMessages,
          activeUsers,
          completedJobs,
          pendingReviews
        },
        recentJobs,
        userGrowth,
        jobStatsByCategory
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics'
    });
  }
};

// Get all users with pagination and filters
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.isActive = status === 'active';
    }
    if (role) {
      query.accountType = role;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, isAdmin, isModerator, adminPermissions } = req.body;

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user fields
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;
    if (typeof isModerator === 'boolean') user.isModerator = isModerator;
    if (adminPermissions) user.adminPermissions = adminPermissions;

    await user.save();

    // Create notification for user
    if (isActive === false) {
      await createSystemNotification(
        user._id,
        'system_alert',
        'Account Suspended',
        'Your account has been suspended by an administrator.'
      );
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
};

// Get jobs for moderation
const getJobsForModeration = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('creator', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting jobs for moderation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get jobs for moderation'
    });
  }
};

// Update job status (moderation)
const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, reason } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    job.status = status;
    if (reason) {
      job.moderationReason = reason;
    }

    await job.save();

    // Create notification for job creator
    await createJobNotification(
      job.creator,
      'job_moderation',
      jobId,
      `Job ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your job "${job.title}" has been ${status}.${reason ? ` Reason: ${reason}` : ''}`
    );

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job status'
    });
  }
};

// Get reviews for moderation
const getReviewsForModeration = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'firstName lastName email')
        .populate('reviewee', 'firstName lastName email')
        .populate('job', 'title category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting reviews for moderation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews for moderation'
    });
  }
};

// Update review status (moderation)
const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, reason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    review.status = status;
    review.moderatedBy = req.moderatorUser._id;
    review.moderatedAt = new Date();
    if (reason) {
      review.moderationReason = reason;
    }

    await review.save();

    // Create notification for review author
    await createJobNotification(
      review.reviewer,
      'review_moderation',
      review.job,
      `Review ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your review has been ${status}.${reason ? ` Reason: ${reason}` : ''}`
    );

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review status'
    });
  }
};

// Get system analytics
const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      userGrowth,
      jobGrowth,
      reviewGrowth,
      topCategories,
      userActivity
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Job growth over time
      Job.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Review growth over time
      Review.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Top job categories
      Job.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // User activity (users with most jobs/reviews)
      User.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'clerkId',
            foreignField: 'creator',
            as: 'postedJobs'
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: 'clerkId',
            foreignField: 'reviewer',
            as: 'postedReviews'
          }
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            jobCount: { $size: '$postedJobs' },
            reviewCount: { $size: '$postedReviews' }
          }
        },
        { $sort: { jobCount: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        period,
        userGrowth,
        jobGrowth,
        reviewGrowth,
        topCategories,
        userActivity
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getJobsForModeration,
  updateJobStatus,
  getReviewsForModeration,
  updateReviewStatus,
  getAnalytics
}; 