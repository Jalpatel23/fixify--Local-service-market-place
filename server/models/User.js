const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Clerk authentication ID
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic profile information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  
  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'US'
      }
    }
  },
  
  // Skills and expertise
  skills: [{
    category: {
      type: String,
      enum: ['plumbing', 'electrical', 'carpentry', 'cleaning', 'gardening', 'painting', 'moving', 'repair', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'intermediate'
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Rating and reviews
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    categories: {
      communication: { type: Number, default: 0 },
      quality: { type: Number, default: 0 },
      timeliness: { type: Number, default: 0 },
      professionalism: { type: Number, default: 0 },
      value: { type: Number, default: 0 }
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  
  // User preferences and settings
  preferences: {
    maxDistance: {
      type: Number,
      default: 25, // miles
      min: 1,
      max: 100
    },
    notificationSettings: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    availability: {
      monday: { start: String, end: String },
      tuesday: { start: String, end: String },
      wednesday: { start: String, end: String },
      thursday: { start: String, end: String },
      friday: { start: String, end: String },
      saturday: { start: String, end: String },
      sunday: { start: String, end: String }
    }
  },
  
  // Account status and verification
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accountType: {
    type: String,
    enum: ['client', 'helper', 'both'],
    default: 'client'
  },

  // Admin and moderation roles
  isAdmin: {
    type: Boolean,
    default: false
  },
  isModerator: {
    type: Boolean,
    default: false
  },
  adminPermissions: [{
    type: String,
    enum: ['users', 'jobs', 'reviews', 'analytics', 'settings']
  }],
  
  // Statistics
  stats: {
    jobsPosted: {
      type: Number,
      default: 0
    },
    jobsCompleted: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    memberSince: {
      type: Date,
      default: Date.now
    }
  },

  // Stripe connected account info
  stripe: {
    accountId: { type: String, index: true },
    payoutsEnabled: { type: Boolean, default: false },
    detailsSubmitted: { type: Boolean, default: false }
  },

  // Saved jobs
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ skills: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ isActive: 1, accountType: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for location string
userSchema.virtual('locationString').get(function() {
  if (this.location.address) {
    const addr = this.location.address;
    return `${addr.city}, ${addr.state}`;
  }
  return 'Location not set';
});

// Method to calculate average rating (backward-compatible)
userSchema.methods.calculateAverageRating = function() {
  if (!this.rating || !Array.isArray(this.rating.reviews) || this.rating.reviews.length === 0) {
    // Fall back to existing average if present, else 0
    return typeof this.rating?.average === 'number' ? this.rating.average : 0;
  }
  const totalRating = this.rating.reviews.reduce((sum, review) => sum + (review?.rating || 0), 0);
  return Math.round((totalRating / this.rating.reviews.length) * 10) / 10;
};

// Method to add a review (only used if legacy embedded reviews exist)
userSchema.methods.addReview = function(reviewData) {
  if (!this.rating) this.rating = {};
  if (!Array.isArray(this.rating.reviews)) this.rating.reviews = [];
  this.rating.reviews.push(reviewData);
  this.rating.totalReviews = this.rating.reviews.length;
  this.rating.average = this.calculateAverageRating();
  return this.save();
};

// Pre-save middleware to update average rating (guarded for legacy path)
userSchema.pre('save', function(next) {
  if (this.rating && Array.isArray(this.rating.reviews) && this.rating.reviews.length > 0) {
    this.rating.average = this.calculateAverageRating();
  }
  next();
});

module.exports = mongoose.model('User', userSchema); 