const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  images: [{
    type: String // URLs to images
  }],
  amenities: [{
    type: String
  }],
  contactInfo: {
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrCode: {
    type: String // URL or path to QR code image
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
hostelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Hostel', hostelSchema);
