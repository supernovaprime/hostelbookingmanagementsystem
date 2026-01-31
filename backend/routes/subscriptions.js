const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Get user's subscription status
router.get('/status', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active',
      currentPeriodEnd: { $gt: new Date() }
    });

    if (!subscription) {
      return res.json({
        hasSubscription: false,
        plan: null,
        features: {},
        message: 'No active subscription found'
      });
    }

    res.json({
      hasSubscription: true,
      plan: subscription.plan,
      features: subscription.features,
      currentPeriodEnd: subscription.currentPeriodEnd,
      status: subscription.status
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Failed to get subscription status', error: error.message });
  }
});

// Check if user has specific premium feature
router.get('/has-feature/:feature', auth, async (req, res) => {
  try {
    const { feature } = req.params;
    const hasFeature = await Subscription.hasPremiumFeatures(req.user.id, feature);

    res.json({ hasFeature });
  } catch (error) {
    console.error('Check feature error:', error);
    res.status(500).json({ message: 'Failed to check feature access', error: error.message });
  }
});

// Create subscription (webhook handler for Stripe)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancel(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
});

// Create checkout session (would integrate with Stripe)
router.post('/create-checkout-session', [
  auth,
  body('plan').isIn(['premium', 'enterprise']).withMessage('Invalid plan'),
  body('priceId').isString().withMessage('Price ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plan, priceId } = req.body;

    // This would integrate with Stripe to create a checkout session
    // For now, return a mock response
    res.json({
      sessionId: 'mock_session_id',
      url: 'https://checkout.stripe.com/mock',
      message: 'Redirect user to this URL for payment'
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    await subscription.cancel();

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription', error: error.message });
  }
});

// Get subscription plans (for frontend display)
router.get('/plans', (req, res) => {
  const plans = {
    premium: {
      name: 'Premium',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      features: {
        fileAttachments: true,
        prioritySupport: true,
        unlimitedMessages: true,
        analytics: false,
        multiLanguage: true,
        advancedReporting: false
      },
      description: 'Unlock premium messaging features'
    },
    enterprise: {
      name: 'Enterprise',
      price: 29.99,
      currency: 'USD',
      interval: 'month',
      features: {
        fileAttachments: true,
        prioritySupport: true,
        unlimitedMessages: true,
        analytics: true,
        multiLanguage: true,
        advancedReporting: true
      },
      description: 'Full access to all features'
    }
  };

  res.json({ plans });
});

// Admin routes for managing subscriptions
router.get('/admin/all', [auth, roleCheck(['superadmin'])], async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const subscriptions = await Subscription.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscription.countDocuments(query);

    res.json({
      subscriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSubscriptions: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions', error: error.message });
  }
});

// Helper functions for webhook handling
async function handleSubscriptionUpdate(subscriptionData) {
  const {
    id: stripeSubscriptionId,
    customer: stripeCustomerId,
    current_period_start,
    current_period_end,
    status,
    items
  } = subscriptionData;

  // Find user by customer ID (you'd store this mapping)
  const user = await User.findOne({ stripeCustomerId });

  if (!user) {
    console.error('User not found for customer:', stripeCustomerId);
    return;
  }

  // Determine plan from price ID
  const priceId = items.data[0].price.id;
  const plan = getPlanFromPriceId(priceId);

  const subscription = await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    {
      user: user._id,
      plan,
      status: status === 'active' ? 'active' : 'inactive',
      stripeCustomerId,
      currentPeriodStart: new Date(current_period_start * 1000),
      currentPeriodEnd: new Date(current_period_end * 1000),
    },
    { upsert: true, new: true }
  );

  console.log('Subscription updated:', subscription._id);
}

async function handleSubscriptionCancel(subscriptionData) {
  const { id: stripeSubscriptionId } = subscriptionData;

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId },
    {
      status: 'cancelled',
      cancelledAt: new Date()
    }
  );

  console.log('Subscription cancelled:', stripeSubscriptionId);
}

function getPlanFromPriceId(priceId) {
  // This would map your Stripe price IDs to plan names
  const priceMap = {
    'price_premium_monthly': 'premium',
    'price_enterprise_monthly': 'enterprise'
  };

  return priceMap[priceId] || 'premium';
}

module.exports = router;
