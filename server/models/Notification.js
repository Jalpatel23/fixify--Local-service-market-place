const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Notification recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification sender (can be system or another user)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Notification type and content
  type: {
    type: String,
    enum: [
      'job_posted',
      'job_accepted',
      'job_completed',
      'job_cancelled',
      'job_reopened',
      'message_received',
      'review_received',
      'payment_received',
      'system_alert',
      'job_reminder',
      'profile_update'
    ],
    required: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Related entities
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  
  // Notification status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date,
    default: null
  },
  
  // Notification priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Action data (for clickable notifications)
  action: {
    type: {
      type: String,
      enum: ['navigate', 'open_modal', 'external_link'],
      required: false
    },
    url: String,
    data: mongoose.Schema.Types.Mixed
  },
  
  // Notification metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Expiration (for temporary notifications)
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, recipient: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark notification as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to create system notification
notificationSchema.statics.createSystemNotification = function(recipientId, type, title, message, metadata = {}) {
  return this.create({
    recipient: recipientId,
    type,
    title,
    message,
    metadata,
    priority: type.includes('urgent') ? 'urgent' : 'medium'
  });
};

// Static method to create job-related notification
notificationSchema.statics.createJobNotification = function(recipientId, type, jobId, title, message, metadata = {}) {
  return this.create({
    recipient: recipientId,
    type,
    title,
    message,
    jobId,
    metadata
  });
};

// Pre-save middleware to set expiration for certain notification types
notificationSchema.pre('save', function(next) {
  // Set expiration for temporary notifications
  if (this.type === 'job_reminder' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 