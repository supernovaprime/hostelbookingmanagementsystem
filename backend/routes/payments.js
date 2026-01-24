const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

// Initialize payment
router.post('/initialize', auth, async (req, res) => {
  try {
    const { amount, email, callback_url } = req.body;
    
    const response = await paystack.transaction.initialize({
      amount: amount * 100, // Convert to kobo
      email,
      callback_url: callback_url || `${process.env.FRONTEND_URL}/payment/callback`,
      metadata: {
        userId: req.user._id,
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "userId",
            value: req.user._id
          }
        ]
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Payment initialization failed', error: error.message });
  }
});

// Verify payment
router.post('/verify/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;
    
    const response = await paystack.transaction.verify(reference);
    
    if (response.data.status === 'success') {
      // Update booking status or handle successful payment
      res.json({
        message: 'Payment verified successfully',
        data: response.data
      });
    } else {
      res.status(400).json({
        message: 'Payment verification failed',
        data: response.data
      });
    }
  } catch (error) {
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

module.exports = router;
