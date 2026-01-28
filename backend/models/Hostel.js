const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates'
      }
    }
  },
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  amenities: [{
    type: String,
    enum: [
      'wifi', 'parking', 'kitchen', 'laundry', 'gym', 'pool', 'security',
      'cleaning', 'reception', 'lounge', 'garden', 'terrace', 'elevator',
      'air_conditioning', 'heating', 'tv', 'fridge', 'microwave', 'coffee_machine'
    ]
  }],
  policies: {
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '11:00' },
    cancellationPolicy: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'moderate'
    },
    petPolicy: { type: Boolean, default: false },
    smokingPolicy: { type: Boolean, default: false },
    ageRestriction: { type: Number, min: 18, default: 18 }
  },
  contactInfo: {
    phone: {
      type: String,
      required: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrCode: {
    type: String // URL or path to QR code image
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  pricing: {
    currency: { type: String, default: 'GHS' },
    minPrice: { type: Number, min: 0 },
    maxPrice: { type: Number, min: 0 }
  },
  stats: {
    totalRooms: { type: Number, default: 0 },
    availableRooms: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0, min: 0, max: 100 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: {
      type: String,
      enum: ['license', 'insurance', 'registration', 'tax_certificate']
    },
    url: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
hostelSchema.index({ location: '2dsphere' });
hostelSchema.index({ 'address.city': 1, 'address.state': 1 });
hostelSchema.index({ manager: 1 });
hostelSchema.index({ isActive: 1, isVerified: 1 });
hostelSchema.index({ slug: 1 });
hostelSchema.index({ 'rating.average': -1 });
hostelSchema.index({ 'pricing.minPrice': 1, 'pricing.maxPrice': 1 });

// Pre-save middleware to generate slug
hostelSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }
  next();
});

// Virtual for full address
hostelSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state}, ${this.address.country} ${this.address.zipCode}`;
});

// Instance method to calculate average rating
hostelSchema.methods.calculateAverageRating = function() {
  if (this.rating.count === 0) {
    this.rating.average = 0;
    return;
  }

  const totalStars = (this.rating.distribution[1] * 1) +
                     (this.rating.distribution[2] * 2) +
                     (this.rating.distribution[3] * 3) +
                     (this.rating.distribution[4] * 4) +
                     (this.rating.distribution[5] * 5);

  this.rating.average = totalStars / this.rating.count;
};

// Instance method to add rating
hostelSchema.methods.addRating = function(stars) {
  if (stars < 1 || stars > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  this.rating.distribution[stars]++;
  this.rating.count++;
  this.calculateAverageRating();
};

// Instance method to update stats
hostelSchema.methods.updateStats = async function() {
  const Room = mongoose.model('Room');
  const Booking = mongoose.model('Booking');

  // Get room stats
  const rooms = await Room.find({ hostel: this._id });
  this.stats.totalRooms = rooms.length;
  this.stats.availableRooms = rooms.filter(room => room.isAvailable).length;

  // Get booking stats
  const bookings = await Booking.find({ hostel: this._id });
  this.stats.totalBookings = bookings.length;

  // Calculate occupancy rate
  if (this.stats.totalRooms > 0) {
    this.stats.occupancyRate = ((this.stats.totalRooms - this.stats.availableRooms) / this.stats.totalRooms) * 100;
  }

  // Update pricing
  const prices = rooms.map(room => room.price).filter(price => price > 0);
  if (prices.length > 0) {
    this.pricing.minPrice = Math.min(...prices);
    this.pricing.maxPrice = Math.max(...prices);
  }

  await this.save();
};

// Static method to find nearby hostels
hostelSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    isVerified: true
  });
};

// Static method to search hostels
hostelSchema.statics.search = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    isVerified: true,
    ...filters
  };

  if (query) {
    searchQuery.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { 'address.city': { $regex: query, $options: 'i' } },
      { 'address.state': { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }

  return this.find(searchQuery);
};

module.exports = mongoose.model('Hostel', hostelSchema);
