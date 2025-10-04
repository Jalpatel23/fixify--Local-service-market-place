const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get user's notifications
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { limit = 10, page = 1, unread } = req.query;
    
    const query = { recipient: req.user._id };
    
    // Filter by read status if specified
    if (unread === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName profileImage')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: 'Internal server error'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateUser, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id, 
        recipient: req.user._id 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: 'Internal server error'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateUser, async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        recipient: req.user._id, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: 'Internal server error'
    });
  }
});

// Delete notification
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
