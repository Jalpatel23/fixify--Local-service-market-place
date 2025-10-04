const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Message participants
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  
  // Media attachments
  attachments: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'document', 'video'],
      required: true
    },
    name: String,
    size: Number
  }],
  
  // Job context (if message is related to a job)
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null,
    index: true
  },
  
  // Message status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Message metadata
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  // System messages (for job updates, etc.) - Optional field
  systemMessage: {
    type: {
      type: String,
      enum: ['job_accepted', 'job_completed', 'job_cancelled', 'payment_received', 'review_requested']
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ isRead: 1, recipient: 1 });

// Virtual for conversation participants
messageSchema.virtual('participants').get(function() {
  return [this.sender, this.recipient].sort();
});

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(user1Id, user2Id) {
  const sortedIds = [user1Id.toString(), user2Id.toString()].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id, limit = 50) {
  const conversationId = this.generateConversationId(user1Id, user2Id);
  return this.find({ conversationId })
    .populate('sender', 'firstName lastName profileImage')
    .populate('recipient', 'firstName lastName profileImage')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get unread count for a user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Pre-save middleware to set conversation ID
messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    this.conversationId = this.constructor.generateConversationId(this.sender, this.recipient);
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema); 