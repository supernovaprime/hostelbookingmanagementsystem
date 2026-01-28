const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get reviews for a hostel (public)
router.get('/hostel/:hostelId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find({ hostel: req.params.hostelId, isVerified: true })
      .populate('tenant', 'name profilePicture')
      .populate('room', 'roomNumber type')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await Review.countDocuments({ hostel: req.params.hostelId, isVerified: true });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { hostel: require('mongoose').Types.ObjectId(req.params.hostelId), isVerified: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: ratingStats[0] || { averageRating: 0, totalReviews: 0 }
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a review (authenticated tenant only)
router.post('/', authenticateToken, requireRole(['tenant']), [
  body('bookingId').isMongoId().withMessage('Valid booking ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  body('cleanliness').optional().isInt({ min: 1, max: 5 }).withMessage('Cleanliness rating must be 1-5'),
  body('location').optional().isInt({ min: 1, max: 5 }).withMessage('Location rating must be 1-5'),
  body('value').optional().isInt({ min: 1, max: 5 }).withMessage('Value rating must be 1-5'),
  body('staff').optional().isInt({ min: 1, max: 5 }).withMessage('Staff rating must be 1-5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, rating, title, comment, cleanliness, location, value, staff, images } = req.body;

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('room')
      .populate('hostel');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    // Check if booking is completed (checked out)
    if (booking.status !== 'checked_out') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    const review = new Review({
      booking: bookingId,
      tenant: req.user._id,
      hostel: booking.hostel._id,
      room: booking.room._id,
      rating,
      title,
      comment,
      cleanliness,
      location,
      value,
      staff,
      images: images || [],
      isVerified: true // Auto-verify for completed bookings
    });

    await review.save();

    // Update booking with review reference
    booking.reviews.push(review._id);
    await booking.save();

    // Update hostel rating
    await updateHostelRating(booking.hostel._id);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update review (review owner only)
router.put('/:id', authenticateToken, requireRole(['tenant']), [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('comment').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update hostel rating
    await updateHostelRating(review.hostel);

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review (review owner or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the review owner or admin
    if (review.tenant.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);

    // Update hostel rating
    await updateHostelRating(review.hostel);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reviews (authenticated user)
router.get('/user/my', authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.find({ tenant: req.user._id })
      .populate('hostel', 'name')
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('User reviews fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to update hostel rating
async function updateHostelRating(hostelId) {
  try {
    const result = await Review.aggregate([
      { $match: { hostel: hostelId, isVerified: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (result.length > 0) {
      const stats = result[0];
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      stats.ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });

      await Hostel.findByIdAndUpdate(hostelId, {
        'rating.average': Math.round(stats.averageRating * 10) / 10,
        'rating.count': stats.count,
        'rating.distribution': distribution
      });
    } else {
      // No reviews, reset rating
      await Hostel.findByIdAndUpdate(hostelId, {
        'rating.average': 0,
        'rating.count': 0,
        'rating.distribution': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  } catch (error) {
    console.error('Hostel rating update error:', error);
  }
}

module.exports = router;
