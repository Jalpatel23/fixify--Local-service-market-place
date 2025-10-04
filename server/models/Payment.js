const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Payment identification
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Job and user references
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    enum: ['usd', 'eur', 'gbp', 'cad', 'aud']
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  helperAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment status
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending',
    index: true
  },
  
  // Payment method
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'bank_transfer', 'digital_wallet'],
      required: true
    },
    last4: String,
    brand: String,
    country: String
  },
  
  // Escrow details
  escrow: {
    isEscrow: {
      type: Boolean,
      default: true
    },
    releaseDate: {
      type: Date
    },
    autoRelease: {
      type: Boolean,
      default: true
    },
    releaseConditions: [{
      type: String,
      enum: ['job_completed', 'client_approval', 'time_elapsed']
    }]
  },
  
  // Dispute handling
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    reason: {
      type: String,
      enum: ['quality_issue', 'not_completed', 'communication', 'other']
    },
    description: String,
    evidence: [{
      type: String,
      description: String,
      url: String
    }],
    resolution: {
      type: String,
      enum: ['refund_client', 'pay_helper', 'partial_refund', 'pending']
    },
    resolvedBy: String, // Admin user ID
    resolvedAt: Date
  },
  
  // Metadata
  description: {
    type: String,
    required: true
  },
  metadata: {
    jobTitle: String,
    jobCategory: String,
    location: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ client: 1, status: 1 });
paymentSchema.index({ helper: 1, status: 1 });
paymentSchema.index({ job: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency.toUpperCase()
  }).format(this.amount / 100);
});

// Virtual for formatted helper amount
paymentSchema.virtual('formattedHelperAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency.toUpperCase()
  }).format(this.helperAmount / 100);
});

// Methods
paymentSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = function() {
  this.status = 'failed';
  return this.save();
};

paymentSchema.methods.refund = function(reason) {
  this.status = 'refunded';
  this.refundedAt = new Date();
  return this.save();
};

paymentSchema.methods.createDispute = function(reason, description) {
  this.dispute.isDisputed = true;
  this.dispute.reason = reason;
  this.dispute.description = description;
  return this.save();
};

paymentSchema.methods.resolveDispute = function(resolution, resolvedBy) {
  this.dispute.resolution = resolution;
  this.dispute.resolvedBy = resolvedBy;
  this.dispute.resolvedAt = new Date();
  return this.save();
};

// Static methods
paymentSchema.statics.getPaymentStats = async function(userId, role = 'all') {
  const id = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  const matchStage = role === 'all'
    ? { $or: [{ client: id }, { helper: id }] }
    : role === 'client'
    ? { client: id }
    : { helper: id };

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalHelperAmount: { $sum: '$helperAmount' }
      }
    }
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
      totalHelperAmount: stat.totalHelperAmount
    };
    return acc;
  }, {});
};

paymentSchema.statics.getRevenueStats = async function(timeframe = 'month') {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalRevenue: { $sum: '$platformFee' },
        totalPayments: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema); 