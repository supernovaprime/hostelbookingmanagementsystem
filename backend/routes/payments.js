const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, paymentLimiter, securityCheck } = require('../middleware/auth');
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialize payment for hostel fees
router.post('/initialize', auth, [
  body('bookingId').isMongoId().withMessage('Valid booking ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['booking_payment', 'deposit', 'final_payment', 'extra_charges']).withMessage('Invalid payment type'),
  body('callback_url').optional().isURL().withMessage('Valid callback URL required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, amount, type, callback_url } = req.body;

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId).populate('hostel');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    // Check if payment already exists for this booking and type
    const existingPayment = await Payment.findOne({
      booking: bookingId,
      type,
      status: { $in: ['pending', 'processing', 'completed'] }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already exists for this booking and type' });
    }

    // Create payment record
    const payment = new Payment({
      booking: bookingId,
      tenant: req.user._id,
      hostel: booking.hostel._id,
      amount: { value: amount, currency: 'GHS' },
      type,
      method: { type: 'card', provider: 'paystack' },
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    await payment.save();

    // Initialize Paystack transaction
    const paystackResponse = await paystack.transaction.initialize({
      amount: Math.round(amount * 100), // Convert to pesewas/kobo
      email: req.user.email,
      callback_url: callback_url || `${process.env.FRONTEND_URL}/payment/callback`,
      reference: payment.reference,
      metadata: {
        paymentId: payment._id,
        bookingId: bookingId,
        userId: req.user._id,
        type,
        custom_fields: [
          {
            display_name: "Payment Reference",
            variable_name: "reference",
            value: payment.reference
          },
          {
            display_name: "Booking ID",
            variable_name: "bookingId",
            value: bookingId
          }
        ]
      }
    });

    // Update payment with transaction ID
    payment.transactionId = paystackResponse.data.reference;
    await payment.save();

    res.json({
      message: 'Payment initialized successfully',
      payment: {
        id: payment._id,
        reference: payment.reference,
        amount: payment.amount,
        type: payment.type
      },
      paystack: paystackResponse.data
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ message: 'Payment initialization failed', error: error.message });
  }
});

// Verify payment
router.post('/verify/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;

    // Find payment record
    const payment = await Payment.findOne({ reference }).populate('booking tenant hostel');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify user owns this payment
    if (payment.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to payment' });
    }

    // Verify with Paystack
    const response = await paystack.transaction.verify(reference);

    if (response.data.status === 'success') {
      // Update payment status
      payment.status = 'completed';
      payment.processedAt = new Date();
      payment.gatewayResponse = response.data;
      payment.fees.gateway = response.data.fees / 100; // Convert from kobo
      payment.fees.total = payment.fees.gateway + payment.fees.processing;

      await payment.save();

      // Update booking status based on payment type
      const booking = payment.booking;
      if (payment.type === 'booking_payment') {
        booking.status = 'confirmed';
        booking.paymentStatus = 'paid';
      } else if (payment.type === 'deposit') {
        booking.depositPaid = true;
      } else if (payment.type === 'final_payment') {
        booking.finalPaymentPaid = true;
        booking.status = 'completed';
      }

      await booking.save();

      // Send notification to tenant
      // TODO: Implement notification system

      res.json({
        message: 'Payment verified and processed successfully',
        payment: {
          id: payment._id,
          reference: payment.reference,
          status: payment.status,
          amount: payment.amount,
          processedAt: payment.processedAt
        },
        booking: {
          id: booking._id,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        }
      });
    } else {
      // Update payment status to failed
      payment.status = 'failed';
      payment.failedAt = new Date();
      payment.failureReason = response.data.gateway_response;
      payment.gatewayResponse = response.data;
      await payment.save();

      // Send failure notification
      await sendPaymentNotification(payment, booking, 'failed');

      res.status(400).json({
        message: 'Payment verification failed',
        payment: {
          id: payment._id,
          status: payment.status,
          failureReason: payment.failureReason
        }
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    // This would typically query your database for payment records
    res.json({ message: 'Payment history endpoint' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize mobile money payment
router.post('/initialize-mobile', auth, [
  body('bookingId').isMongoId().withMessage('Valid booking ID required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['booking_payment', 'deposit', 'final_payment', 'extra_charges']).withMessage('Invalid payment type'),
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('network').isIn(['mtn', 'vodafone', 'airteltigo']).withMessage('Valid network required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, amount, type, phoneNumber, network } = req.body;

    // Verify booking exists and belongs to user
    const booking = await Booking.findById(bookingId).populate('hostel');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to booking' });
    }

    // Check if payment already exists for this booking and type
    const existingPayment = await Payment.findOne({
      booking: bookingId,
      type,
      status: { $in: ['pending', 'processing', 'completed'] }
    });

    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already exists for this booking and type' });
    }

    // Create payment record for mobile money
    const payment = new Payment({
      booking: bookingId,
      tenant: req.user._id,
      hostel: booking.hostel._id,
      amount: { value: amount, currency: 'GHS' },
      type,
      method: { type: 'mobile_money', provider: network, phoneNumber },
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        network,
        phoneNumber
      }
    });

    await payment.save();

    // Initialize mobile money payment (using Paystack's mobile money support)
    const paystackResponse = await paystack.transaction.initialize({
      amount: Math.round(amount * 100), // Convert to pesewas/kobo
      email: req.user.email,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      reference: payment.reference,
      mobile_money: {
        phone: phoneNumber,
        provider: network
      },
      metadata: {
        paymentId: payment._id,
        bookingId: bookingId,
        userId: req.user._id,
        type,
        paymentMethod: 'mobile_money',
        network,
        custom_fields: [
          {
            display_name: "Payment Reference",
            variable_name: "reference",
            value: payment.reference
          },
          {
            display_name: "Booking ID",
            variable_name: "bookingId",
            value: bookingId
          },
          {
            display_name: "Network",
            variable_name: "network",
            value: network
          }
        ]
      }
    });

    // Update payment with transaction ID
    payment.transactionId = paystackResponse.data.reference;
    await payment.save();

    res.json({
      message: 'Mobile money payment initialized successfully',
      payment: {
        id: payment._id,
        reference: payment.reference,
        amount: payment.amount,
        type: payment.type,
        method: payment.method
      },
      paystack: paystackResponse.data
    });
  } catch (error) {
    console.error('Mobile money payment initialization error:', error);
    res.status(500).json({ message: 'Mobile money payment initialization failed', error: error.message });
  }
});

// Send SMS notification
async function sendSMS(to, message) {
  try {
    const result = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });
    console.log('SMS sent successfully:', result.sid);
    return result;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}

// Send payment notification
async function sendPaymentNotification(payment, booking, status) {
  try {
    const tenant = await User.findById(payment.tenant);
    if (!tenant) return;

    let message = '';
    let title = '';

    if (status === 'success') {
      title = 'Payment Successful';
      message = `Hi ${tenant.firstName}, your payment of GHS ${payment.amount.value} for ${booking.hostel.name} has been processed successfully. Reference: ${payment.reference}`;

      // Send SMS if payment was made via mobile money
      if (payment.method.type === 'mobile_money' && tenant.phoneNumber) {
        await sendSMS(tenant.phoneNumber, message);
      }
    } else if (status === 'failed') {
      title = 'Payment Failed';
      message = `Hi ${tenant.firstName}, your payment of GHS ${payment.amount.value} for ${booking.hostel.name} could not be processed. Please try again or contact support. Reference: ${payment.reference}`;

      // Send SMS for failed payments too
      if (tenant.phoneNumber) {
        await sendSMS(tenant.phoneNumber, message);
      }
    }

    // Create in-app notification
    const notification = new Notification({
      recipient: tenant._id,
      type: status === 'success' ? 'payment_received' : 'payment_failed',
      title,
      message,
      data: {
        paymentId: payment._id,
        bookingId: booking._id,
        amount: payment.amount.value,
        reference: payment.reference
      },
      channels: ['in_app', 'sms'],
      priority: status === 'success' ? 'medium' : 'high'
    });

    await notification.save();
  } catch (error) {
    console.error('Notification sending failed:', error);
  }
}

module.exports = router;
