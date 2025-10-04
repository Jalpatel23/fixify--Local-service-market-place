const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Job creator
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Job details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'carpentry', 'cleaning', 'gardening', 'painting', 'moving', 'repair', 'other'],
    required: true,
    index: true
  },
  
  // Budget and pricing
  budget: {
    min: {
      type: Number,
      required: true,
      min: 1
    },
    max: {
      type: Number,
      required: true,
      min: 1
    },
    isNegotiable: {
      type: Boolean,
      default: true
    }
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
  
  // Timing and scheduling
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    }
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  // Job status and assignment
  status: {
    type: String,
    enum: ['open', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  
  // Requirements and preferences
  requirements: {
    skills: [{
      type: String,
      enum: ['plumbing', 'electrical', 'carpentry', 'cleaning', 'gardening', 'painting', 'moving', 'repair', 'other']
    }],
    experience: {
      type: String,
      enum: ['any', 'beginner', 'intermediate', 'expert'],
      default: 'any'
    },
    verifiedOnly: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  
  // Media and attachments
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Job visibility and preferences
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  maxDistance: {
    type: Number,
    default: 40, // kilometers
    min: 1,
    max: 100
  },
  
  // Communication and contact
  contactPreference: {
    type: String,
    enum: ['message', 'phone', 'email'],
    default: 'message'
  },
  
  // Job statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    savedBy: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      default: []
    }
  },
  
  // Additional information
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  
  // Cancellation and disputes
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ 'location.coordinates': '2dsphere' });
jobSchema.index({ status: 1, category: 1 });
jobSchema.index({ creator: 1, status: 1 });
jobSchema.index({ 'budget.min': 1, 'budget.max': 1 });
jobSchema.index({ preferredDate: 1 });
jobSchema.index({ createdAt: -1 });

// Text index for search functionality
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 3
  }
});

// Virtual for budget range
jobSchema.virtual('budgetRange').get(function() {
  if (this.budget.min === this.budget.max) {
    return `$${this.budget.min}`;
  }
  return `$${this.budget.min} - $${this.budget.max}`;
});

// Virtual for location string
jobSchema.virtual('locationString').get(function() {
  if (this.location.address) {
    const addr = this.location.address;
    return `${addr.city}, ${addr.state}`;
  }
  return 'Location not set';
});

// Virtual for time remaining
jobSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const preferred = new Date(this.preferredDate);
  const diff = preferred - now;
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  return 'Less than 1 hour remaining';
});

// Method to check if job is available
jobSchema.methods.isAvailable = function() {
  return this.status === 'open' && this.assignedTo === null;
};

// Method to accept job
jobSchema.methods.acceptJob = function(helperId) {
  if (!this.isAvailable()) {
    throw new Error('Job is not available');
  }
  
  this.status = 'accepted';
  this.assignedTo = helperId;
  this.acceptedAt = new Date();
  return this.save();
};

// Method to complete job
jobSchema.methods.completeJob = function() {
  if (this.status !== 'accepted' && this.status !== 'in_progress') {
    throw new Error('Job cannot be completed');
  }
  
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to cancel job
jobSchema.methods.cancelJob = function(userId, reason, isCreatorCancelling = false) {
  if (isCreatorCancelling) {
    // Job creator is cancelling - mark as cancelled permanently
    this.status = 'cancelled';
    this.cancelledBy = userId;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  } else {
    // Assigned user is cancelling their acceptance - reopen the job
    this.status = 'open';
    this.assignedTo = null;
    this.acceptedAt = null;
    this.cancelledBy = userId;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
  }
  return this.save();
};

// Method to increment view count
jobSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

// Method to add application
jobSchema.methods.addApplication = function() {
  this.stats.applications += 1;
  return this.save();
};

// Method to update stats
jobSchema.methods.updateStats = function(field, increment) {
  if (this.stats[field] !== undefined) {
    if (Array.isArray(this.stats[field])) {
      // Handle array fields like savedBy
      if (increment > 0) {
        // This should be handled by the controller, not here
        return Promise.resolve(this);
      } else {
        // This should be handled by the controller, not here
        return Promise.resolve(this);
      }
    } else {
      // Handle numeric fields like views, applications
      this.stats[field] += increment;
      return this.save();
    }
  }
  return Promise.resolve(this);
};

// Pre-save middleware to validate budget
jobSchema.pre('save', function(next) {
  if (this.budget.min > this.budget.max) {
    return next(new Error('Minimum budget cannot be greater than maximum budget'));
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);