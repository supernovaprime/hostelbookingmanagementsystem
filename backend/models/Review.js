const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  cleanliness: {
    type: Number,
    min: 1,
    max: 5
  },
  location: {
    type: Number,
    min: 1,
    max: 5
  },
  value: {
    type: Number,
    min: 1,
    max: 5
  },
  staff: {
    type: Number,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  images: [{
    type: String // URLs to review images
  }],
  isVerified: {
    type: Boolean,
    default: false // Verified if booking was completed
  },
  helpful: {
    type: Number,
    default: 0
  },
  response: {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      maxlength: 500
    },
    respondedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
reviewSchema.index({ hostel: 1, rating: -1 });
reviewSchema.index({ tenant: 1, createdAt: -1 });

// Virtual for average rating calculation
reviewSchema.virtual('averageRating').get(function() {
  const ratings = [this.cleanliness, this.location, this.value, this.staff].filter(r => r);
  return ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : this.rating;
});

module.exports = mongoose.model('Review', reviewSchema);
