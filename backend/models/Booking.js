const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  checkInDate: {
    type: Date,
    required: true
  },
  checkOutDate: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'GHS'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  specialRequests: {
    type: String
  },
  bookingReference: {
    type: String,
    unique: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  checkedInAt: {
    type: Date
  },
  checkedOutAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }]
}, {
  timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    this.bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Index for efficient queries
bookingSchema.index({ tenant: 1, status: 1 });
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ hostel: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
