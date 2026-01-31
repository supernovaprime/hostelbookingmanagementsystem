const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['premium', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  stripeSubscriptionId: {
    type: String,
    required: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: Date,
  features: {
    fileAttachments: { type: Boolean, default: true },
    prioritySupport: { type: Boolean, default: true },
    unlimitedMessages: { type: Boolean, default: true },
    analytics: { type: Boolean, default: false },
    multiLanguage: { type: Boolean, default: true },
    advancedReporting: { type: Boolean, default: false }
  },
  metadata: {
    source: String,
    campaign: String,
    referrer: String
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.currentPeriodEnd > new Date();
});

// Instance method to cancel subscription
subscriptionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  return this.save();
};

// Static method to get active subscriptions
subscriptionSchema.statics.getActiveSubscriptions = function() {
  return this.find({
    status: 'active',
    currentPeriodEnd: { $gt: new Date() }
  }).populate('user', 'name email');
};

// Static method to check if user has premium features
subscriptionSchema.statics.hasPremiumFeatures = async function(userId, feature) {
  const subscription = await this.findOne({
    user: userId,
    status: 'active',
    currentPeriodEnd: { $gt: new Date() }
  });

  if (!subscription) return false;

  return subscription.features[feature] || false;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
