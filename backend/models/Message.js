const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['inquiry', 'complaint', 'booking_question', 'general', 'maintenance_related'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'replied'],
    default: 'sent'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    mimetype: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  conversationId: {
    type: String,
    required: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archivedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });
messageSchema.index({ hostel: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ status: 1, recipient: 1 });
messageSchema.index({ 'archivedBy.user': 1 });

// Virtual for checking if message is part of a conversation
messageSchema.virtual('hasReplies').get(async function() {
  const replyCount = await mongoose.model('Message').countDocuments({
    parentMessage: this._id
  });
  return replyCount > 0;
});

// Pre-save middleware to generate conversation ID
messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    // If this is a reply, use parent's conversation ID
    if (this.parentMessage) {
      // This will be set by the application logic
      this.conversationId = this.parentMessage.toString();
    } else {
      // Generate new conversation ID for new messages
      this.conversationId = `conv_${this._id}`;
    }
  }
  next();
});

// Static method to get conversation thread
messageSchema.statics.getConversation = function(conversationId) {
  return this.find({ conversationId })
    .populate('sender', 'firstName lastName email role')
    .populate('recipient', 'firstName lastName email role')
    .populate('hostel', 'name address')
    .sort({ createdAt: 1 });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(userId, messageIds) {
  return this.updateMany(
    { _id: { $in: messageIds }, recipient: userId },
    { status: 'read' }
  );
};

// Instance method to archive message
messageSchema.methods.archive = function(userId) {
  if (!this.archivedBy.some(archive => archive.user.toString() === userId.toString())) {
    this.archivedBy.push({ user: userId });
  }
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
