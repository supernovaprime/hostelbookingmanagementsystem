const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  floor: {
    type: Number,
    min: 0
  },
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'dormitory', 'private', 'shared'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  size: {
    value: { type: Number, min: 0 },
    unit: { type: String, enum: ['sqm', 'sqft'], default: 'sqm' }
  },
  bedType: {
    type: String,
    enum: ['single', 'double', 'bunk', 'sofa', 'mattress'],
    default: 'single'
  },
  price: {
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'GHS'
    },
    period: {
      type: String,
      enum: ['night', 'week', 'month'],
      default: 'month'
    },
    discounts: [{
      type: {
        type: String,
        enum: ['early_bird', 'long_stay', 'seasonal', 'group']
      },
      percentage: { type: Number, min: 0, max: 100 },
      minStay: { type: Number, min: 1 },
      validFrom: Date,
      validUntil: Date
    }]
  },
  description: {
    type: String,
    maxlength: 500
  },
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  amenities: [{
    type: String,
    enum: [
      'private_bathroom', 'shared_bathroom', 'balcony', 'window', 'desk',
      'chair', 'wardrobe', 'tv', 'air_conditioning', 'heating', 'fan',
      'mini_fridge', 'microwave', 'coffee_machine', 'safe', 'hairdryer'
    ]
  }],
  view: {
    type: String,
    enum: ['city', 'garden', 'mountain', 'sea', 'courtyard', 'street']
  },
  smokingAllowed: {
    type: Boolean,
    default: false
  },
  petFriendly: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availabilityCalendar: [{
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked', 'maintenance'],
      default: 'available'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: {
    type: Date
  },
  blockedReason: {
    type: String
  },
  maintenanceRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceRequest'
  }],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
roomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hostel: 1, isAvailable: 1 });
roomSchema.index({ hostel: 1, type: 1 });
roomSchema.index({ 'price.baseAmount': 1 });
roomSchema.index({ capacity: 1 });
roomSchema.index({ 'availabilityCalendar.date': 1 });

// Pre-save middleware to generate tags
roomSchema.pre('save', function(next) {
  if (this.isModified('type') || this.isModified('capacity') || this.isModified('amenities')) {
    this.tags = [];

    // Add type-based tags
    this.tags.push(this.type);

    // Add capacity-based tags
    if (this.capacity === 1) this.tags.push('single-occupancy');
    else if (this.capacity === 2) this.tags.push('double-occupancy');
    else if (this.capacity >= 3) this.tags.push('multiple-occupancy');

    // Add amenity-based tags
    if (this.amenities.includes('private_bathroom')) this.tags.push('private-bathroom');
    if (this.amenities.includes('balcony')) this.tags.push('balcony');
    if (this.amenities.includes('air_conditioning')) this.tags.push('air-conditioned');

    // Add price-based tags
    if (this.price.baseAmount < 50) this.tags.push('budget');
    else if (this.price.baseAmount < 100) this.tags.push('mid-range');
    else this.tags.push('premium');
  }
  next();
});

// Virtual for current availability status
roomSchema.virtual('currentStatus').get(function() {
  if (this.isBlocked) return 'blocked';
  if (!this.isAvailable) return 'unavailable';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntry = this.availabilityCalendar.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  return todayEntry ? todayEntry.status : 'available';
});

// Instance method to check availability for date range
roomSchema.methods.isAvailableForDates = function(checkIn, checkOut) {
  if (this.isBlocked || !this.isAvailable) return false;

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
    const entry = this.availabilityCalendar.find(calEntry => {
      const calDate = new Date(calEntry.date);
      calDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return calDate.getTime() === checkDate.getTime();
    });

    if (entry && entry.status !== 'available') return false;
  }

  return true;
};

// Instance method to calculate discounted price
roomSchema.methods.getDiscountedPrice = function(stayDuration, discountType) {
  let finalPrice = this.price.baseAmount;

  if (this.price.discounts && this.price.discounts.length > 0) {
    const applicableDiscounts = this.price.discounts.filter(discount => {
      if (discountType && discount.type !== discountType) return false;
      if (discount.minStay && stayDuration < discount.minStay) return false;
      if (discount.validFrom && new Date() < discount.validFrom) return false;
      if (discount.validUntil && new Date() > discount.validUntil) return false;
      return true;
    });

    if (applicableDiscounts.length > 0) {
      const maxDiscount = Math.max(...applicableDiscounts.map(d => d.percentage));
      finalPrice = finalPrice * (1 - maxDiscount / 100);
    }
  }

  return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
};

// Static method to find available rooms
roomSchema.statics.findAvailable = function(hostelId, checkIn, checkOut, filters = {}) {
  const query = {
    hostel: hostelId,
    isAvailable: true,
    isBlocked: false,
    ...filters
  };

  return this.find(query).then(rooms => {
    return rooms.filter(room => room.isAvailableForDates(checkIn, checkOut));
  });
};

// Static method to search rooms
roomSchema.statics.search = function(query, filters = {}) {
  const searchQuery = { ...filters };

  if (query) {
    searchQuery.$or = [
      { roomNumber: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { type: { $regex: query, $options: 'i' } },
      { amenities: { $in: [new RegExp(query, 'i')] } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }

  return this.find(searchQuery);
};

module.exports = mongoose.model('Room', roomSchema);
