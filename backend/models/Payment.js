const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  amount: {
    value: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'GHS' }
  },
  type: {
    type: String,
    enum: ['booking_payment', 'deposit', 'final_payment', 'refund', 'cancellation_fee', 'extra_charges'],
    required: true
  },
  method: {
    type: {
      type: String,
      enum: ['card', 'bank_transfer', 'mobile_money', 'cash', 'paypal', 'stripe', 'paystack']
    },
    provider: String, // e.g., 'visa', 'mastercard', 'mtn', 'vodafone'
    details: mongoose.Schema.Types.Mixed // Store payment method specific data
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  reference: {
    type: String,
    unique: true
  },
  gatewayResponse: mongoose.Schema.Types.Mixed, // Store full response from payment gateway
  fees: {
    gateway: { type: Number, default: 0 },
    processing: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  refund: {
    amount: { type: Number, min: 0 },
    reason: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reference: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String,
    deviceFingerprint: String
  },
  processedAt: Date,
  failedAt: Date,
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0,
    max: 3
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ booking: 1, type: 1 });
paymentSchema.index({ tenant: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

// Generate payment reference before saving
paymentSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Virtual for checking if payment is refundable
paymentSchema.virtual('isRefundable').get(function() {
  return ['completed', 'partially_refunded'].includes(this.status) && this.amount.value > (this.refund?.amount || 0);
});

module.exports = mongoose.model('Payment', paymentSchema);
