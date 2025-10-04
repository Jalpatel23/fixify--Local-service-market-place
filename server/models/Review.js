const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review details
  reviewer: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User
    required: true,
    ref: 'User'
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User
    required: true,
    ref: 'User'
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },

  // Rating (1-5 stars)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number between 1 and 5'
    }
  },

  // Review content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  // Review categories (for detailed feedback)
  categories: {
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    }
  },

  // Review status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // Moderation
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId, // Moderator (User)
    ref: 'User'
  },
  moderatedAt: Date,
  moderationReason: String,

  // Helpful votes
  helpfulVotes: {
    up: {
      type: Number,
      default: 0
    },
    down: {
      type: Number,
      default: 0
    }
  },

  // User who found this helpful
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId, // Users who marked helpful
    ref: 'User'
  }],

  // Response from the reviewed user
  response: {
    content: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },

  // Flags for inappropriate content
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId, // Flagging user
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'other']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
reviewSchema.index({ reviewer: 1, job: 1 }, { unique: true }); // One review per job per reviewer
reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ job: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });

// Virtual for overall rating
reviewSchema.virtual('overallRating').get(function() {
  const categories = this.categories;
  const values = Object.values(categories);
  return values.reduce((sum, val) => sum + val, 0) / values.length;
});

// Virtual for helpful score
reviewSchema.virtual('helpfulScore').get(function() {
  return this.helpfulVotes.up - this.helpfulVotes.down;
});

// Pre-save middleware to update timestamps
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to calculate average rating for a user
reviewSchema.statics.getAverageRating = async function(userId) {
  const id = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  const result = await this.aggregate([
    {
      $match: {
        reviewee: id,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const { averageRating, totalReviews, ratingDistribution } = result[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution: distribution
  };
};

// Method to get category averages for a user
reviewSchema.statics.getCategoryAverages = async function(userId) {
  const id = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  const result = await this.aggregate([
    {
      $match: {
        reviewee: id,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        communication: { $avg: '$categories.communication' },
        quality: { $avg: '$categories.quality' },
        timeliness: { $avg: '$categories.timeliness' },
        professionalism: { $avg: '$categories.professionalism' },
        value: { $avg: '$categories.value' }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      communication: 0,
      quality: 0,
      timeliness: 0,
      professionalism: 0,
      value: 0
    };
  }

  const categories = result[0];
  return {
    communication: Math.round(categories.communication * 10) / 10,
    quality: Math.round(categories.quality * 10) / 10,
    timeliness: Math.round(categories.timeliness * 10) / 10,
    professionalism: Math.round(categories.professionalism * 10) / 10,
    value: Math.round(categories.value * 10) / 10
  };
};

// Method to mark review as helpful
reviewSchema.methods.markHelpful = async function(userId, isHelpful) {
  const userIdStr = userId.toString();
  const index = this.helpfulBy.findIndex(id => id.toString() === userIdStr);

  if (isHelpful) {
    if (index === -1) {
      this.helpfulBy.push(mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId);
      this.helpfulVotes.up += 1;
    }
  } else {
    if (index !== -1) {
      this.helpfulBy.splice(index, 1);
      this.helpfulVotes.up = Math.max(0, this.helpfulVotes.up - 1);
    }
  }

  return this.save();
};

// Method to flag review
reviewSchema.methods.flagReview = async function(userId, reason) {
  const userIdStr = userId.toString();
  // Check if user already flagged this review
  const existingFlag = this.flags.find(flag => flag.user && flag.user.toString() === userIdStr);

  if (existingFlag) {
    existingFlag.reason = reason;
    existingFlag.createdAt = new Date();
  } else {
    this.flags.push({
      user: mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId,
      reason,
      createdAt: new Date()
    });
  }

  return this.save();
};

// Method to respond to review
reviewSchema.methods.addResponse = async function(content) {
  this.response = {
    content,
    createdAt: new Date()
  };
  
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema); 