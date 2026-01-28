const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['electrical', 'plumbing', 'structural', 'cleaning', 'furniture', 'appliance', 'security', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  images: [{
    type: String // URLs to maintenance request images
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Maintenance staff or manager
  },
  estimatedCompletion: {
    type: Date
  },
  actualCompletion: {
    type: Date
  },
  cost: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'GHS'
    }
  },
  notes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      maxlength: 300
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
maintenanceRequestSchema.index({ hostel: 1, status: 1 });
maintenanceRequestSchema.index({ tenant: 1, createdAt: -1 });
maintenanceRequestSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
