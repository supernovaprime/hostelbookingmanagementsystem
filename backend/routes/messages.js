const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Message = require('../models/Message');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Subscription = require('../models/Subscription');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files per message
  }
});

// Send a new message with file attachments (premium feature)
router.post('/', [
  auth,
  upload.array('attachments', 5), // Allow up to 5 files
  body('recipient').isMongoId().withMessage('Valid recipient ID required'),
  body('hostel').isMongoId().withMessage('Valid hostel ID required'),
  body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject must be 1-200 characters'),
  body('content').isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters'),
  body('messageType').optional().isIn(['inquiry', 'complaint', 'booking_question', 'general', 'maintenance_related']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, hostel, subject, content, messageType, priority, parentMessage } = req.body;

    // Verify recipient exists and is a manager
    const recipientUser = await User.findById(recipient);
    if (!recipientUser || recipientUser.role !== 'manager') {
      return res.status(400).json({ message: 'Invalid recipient. Must be a hostel manager.' });
    }

    // Verify hostel exists and recipient manages it
    const hostelDoc = await Hostel.findById(hostel);
    if (!hostelDoc) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    if (hostelDoc.manager.toString() !== recipient) {
      return res.status(403).json({ message: 'Recipient does not manage this hostel' });
    }

    // If this is a reply, verify the parent message exists and user has access
    let conversationId = null;
    if (parentMessage) {
      const parentMsg = await Message.findById(parentMessage);
      if (!parentMsg) {
        return res.status(404).json({ message: 'Parent message not found' });
      }

      // Check if user is part of this conversation
      const isSender = parentMsg.sender.toString() === req.user.id;
      const isRecipient = parentMsg.recipient.toString() === req.user.id;

      if (!isSender && !isRecipient) {
        return res.status(403).json({ message: 'Access denied to this conversation' });
      }

      conversationId = parentMsg.conversationId;
    }

    const message = new Message({
      sender: req.user.id,
      recipient,
      hostel,
      subject,
      content,
      messageType: messageType || 'general',
      priority: priority || 'medium',
      parentMessage,
      conversationId,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await message.save();

    // Populate the saved message for response
    await message.populate('sender', 'firstName lastName email role');
    await message.populate('recipient', 'firstName lastName email role');
    await message.populate('hostel', 'name address');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// Get user's messages (sent and received)
router.get('/my-messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, messageType } = req.query;

    const query = {
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ],
      isArchived: false
    };

    if (status) query.status = status;
    if (messageType) query.messageType = messageType;

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role')
      .populate('hostel', 'name address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

// Get conversation thread
router.get('/conversation/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Find one message from the conversation to check access
    const sampleMessage = await Message.findOne({ conversationId });
    if (!sampleMessage) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is part of this conversation
    const isSender = sampleMessage.sender.toString() === req.user.id;
    const isRecipient = sampleMessage.recipient.toString() === req.user.id;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    const messages = await Message.getConversation(conversationId);

    // Mark messages as read for the recipient
    if (isRecipient) {
      await Message.markAsRead(req.user.id, messages.map(msg => msg._id));
    }

    res.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation', error: error.message });
  }
});

// Mark messages as read
router.put('/mark-read', [
  auth,
  body('messageIds').isArray().withMessage('Message IDs array required'),
  body('messageIds.*').isMongoId().withMessage('Valid message ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageIds } = req.body;

    await Message.markAsRead(req.user.id, messageIds);

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read', error: error.message });
  }
});

// Archive message
router.put('/:messageId/archive', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is part of this message
    const isSender = message.sender.toString() === req.user.id;
    const isRecipient = message.recipient.toString() === req.user.id;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Access denied to this message' });
    }

    await message.archive(req.user.id);

    res.json({ message: 'Message archived successfully' });
  } catch (error) {
    console.error('Archive message error:', error);
    res.status(500).json({ message: 'Failed to archive message', error: error.message });
  }
});

// Get message statistics for user
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
          isArchived: false
        }
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          sentMessages: {
            $sum: { $cond: [{ $eq: ['$sender', userId] }, 1, 0] }
          },
          receivedMessages: {
            $sum: { $cond: [{ $eq: ['$recipient', userId] }, 1, 0] }
          },
          unreadMessages: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userId] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalMessages: 0,
      sentMessages: 0,
      receivedMessages: 0,
      unreadMessages: 0
    };

    res.json({ stats: result });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch message statistics', error: error.message });
  }
});

// Get messages for manager's hostels (Manager only)
router.get('/hostel-messages', [auth, roleCheck(['manager'])], async (req, res) => {
  try {
    const { page = 1, limit = 20, status, messageType } = req.query;

    const query = {
      hostel: { $in: req.user.managedHostels },
      recipient: req.user.id,
      isArchived: false
    };

    if (status) query.status = status;
    if (messageType) query.messageType = messageType;

    const messages = await Message.find(query)
      .populate('sender', 'firstName lastName email role')
      .populate('recipient', 'firstName lastName email role')
      .populate('hostel', 'name address')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get hostel messages error:', error);
    res.status(500).json({ message: 'Failed to fetch hostel messages', error: error.message });
  }
});

module.exports = router;
