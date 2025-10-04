const Message = require('../models/Message');
const User = require('../models/User');
const Job = require('../models/Job');
const { createSystemNotification } = require('../utils/database');

// Get conversations for a user with enhanced data
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all conversations where user is either sender or recipient
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalMessages: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser'
        }
      },
      {
        $unwind: '$otherUser'
      },
      {
        $project: {
          conversationId: '$_id',
          otherUser: {
            _id: '$otherUser._id',
            firstName: '$otherUser.firstName',
            lastName: '$otherUser.lastName',
            profileImage: '$otherUser.profileImage',
            rating: '$otherUser.rating',
            isOnline: '$otherUser.isOnline',
            lastSeen: '$otherUser.lastSeen'
          },
          lastMessage: {
            content: '$lastMessage.content',
            type: '$lastMessage.messageType',
            createdAt: '$lastMessage.createdAt',
            sender: '$lastMessage.sender',
            isRead: '$lastMessage.isRead'
          },
          unreadCount: 1,
          totalMessages: 1,
          updatedAt: '$lastMessage.createdAt'
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ]);

    // Filter out conversations with deleted users
    const validConversations = conversations.filter(conv => conv.otherUser);

    res.json({
      success: true,
      data: validConversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
};

// Get messages for a specific conversation with pagination
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Verify user is part of this conversation
    const conversation = await Message.findOne({
      $or: [
        { sender: userId, recipient: conversationId },
        { sender: conversationId, recipient: userId }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get messages with pagination
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: conversationId },
        { sender: conversationId, recipient: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('sender', '_id firstName lastName profileImage')
    .populate('recipient', '_id firstName lastName profileImage')
    .lean();

    // Reverse to get chronological order
    const reversedMessages = messages.reverse();

    // Mark messages as read
    await Message.updateMany(
      {
        sender: conversationId,
        recipient: userId,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: userId, recipient: conversationId },
        { sender: conversationId, recipient: userId }
      ]
    });

    res.json({
      success: true,
      data: reversedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
};

// Send a message with enhanced validation
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, type = 'text', jobId = null, attachments = [] } = req.body;
    const senderId = req.user._id;

    // Validate recipient exists and is not the same as sender
    if (senderId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send message to yourself'
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Validate sender exists
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        error: 'Sender not found'
      });
    }

    // Validate job if provided
    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }
    }

    // Create message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      messageType: type,
      jobId,
      attachments,
      conversationId: Message.generateConversationId(senderId, recipientId)
    });

    await message.save();

    // Populate sender and recipient info
    await message.populate('sender', '_id firstName lastName profileImage');
    await message.populate('recipient', '_id firstName lastName profileImage');

    // Create notification for recipient
    try {
      await createSystemNotification(
        recipientId,
        'message',
        'New Message',
        `You have a new message from ${sender.firstName} ${sender.lastName}`,
        {
          messageId: message._id,
          senderId: senderId,
          conversationId: message.conversationId
        }
      );
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the message send if notification fails
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const result = await Message.updateMany(
      {
        sender: conversationId,
        recipient: userId,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
};

// Delete a message (soft delete for now)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Only sender can delete their own message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    // For now, we'll actually delete the message
    // In a production app, you might want to implement soft delete
    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
};

// Search messages with enhanced functionality
const searchMessages = async (req, res) => {
  try {
    const { query, conversationId = null, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    let searchQuery = {
      $and: [
        {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        },
        {
          content: { $regex: query.trim(), $options: 'i' }
        }
      ]
    };

    // If searching within a specific conversation
    if (conversationId) {
      searchQuery.$and.push({
        $or: [
          { sender: userId, recipient: conversationId },
          { sender: conversationId, recipient: userId }
        ]
      });
    }

    const messages = await Message.find(searchQuery)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('sender', '_id firstName lastName profileImage')
    .populate('recipient', '_id firstName lastName profileImage');

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search messages'
    });
  }
};

// Get conversation statistics
const getConversationStats = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is part of this conversation
    const conversation = await Message.findOne({
      $or: [
        { sender: userId, recipient: conversationId },
        { sender: conversationId, recipient: userId }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const stats = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId, recipient: conversationId },
            { sender: conversationId, recipient: userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          unreadMessages: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          },
          firstMessage: { $min: '$createdAt' },
          lastMessage: { $max: '$createdAt' }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalMessages: 0,
        unreadMessages: 0,
        firstMessage: null,
        lastMessage: null
      }
    });
  } catch (error) {
    console.error('Error getting conversation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation statistics'
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  getConversationStats
}; 