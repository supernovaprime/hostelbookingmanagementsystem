const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'dormitory'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'GHS'
    },
    period: {
      type: String,
      enum: ['night', 'week', 'month'],
      default: 'month'
    }
  },
  description: {
    type: String
  },
  images: [{
    type: String
  }],
  amenities: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: {
    type: Date
  },
  maintenanceRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest'
  }]
}, {
  timestamps: true
});

// Compound index for hostel and room number uniqueness
roomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
