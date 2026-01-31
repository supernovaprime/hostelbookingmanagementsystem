const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Create a new booking (Tenant only)
router.post('/', [
  auth,
  roleCheck(['tenant']),
  body('room').notEmpty().withMessage('Room ID is required'),
  body('checkInDate').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOutDate').isISO8601().withMessage('Valid check-out date is required'),
  body('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

    // Check if room exists and is available
    const roomDoc = await Room.findById(room).populate('hostel');
    if (!roomDoc) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (!roomDoc.isAvailable || roomDoc.isBlocked) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Check capacity
    if (numberOfGuests > roomDoc.capacity) {
      return res.status(400).json({ message: 'Number of guests exceeds room capacity' });
    }

    // Calculate total amount
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * roomDoc.price.amount;

    const booking = new Booking({
      tenant: req.user.id,
      room,
      hostel: roomDoc.hostel._id,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalAmount,
      specialRequests
    });

    await booking.save();

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookings (Tenant only)
router.get('/my-bookings', [auth, roleCheck(['tenant'])], async (req, res) => {
  try {
    const bookings = await Booking.find({ tenant: req.user.id })
      .populate('room', 'roomNumber type')
      .populate('hostel', 'name address')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bookings for manager's hostels (Manager only)
router.get('/hostel-bookings', [auth, roleCheck(['manager'])], async (req, res) => {
  try {
    const bookings = await Booking.find({ hostel: { $in: req.user.managedHostels } })
      .populate('tenant', 'name email')
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update booking status (Manager only - own hostel)
router.put('/:id/status', [
  auth,
  roleCheck(['manager']),
  body('status').isIn(['confirmed', 'rejected', 'checked_in', 'checked_out', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const booking = await Booking.findById(req.params.id).populate('hostel');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user manages this hostel
    if (booking.hostel.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = { status: req.body.status, approvedBy: req.user.id, approvedAt: new Date() };

    if (req.body.status === 'checked_in') {
      updateData.checkedInAt = new Date();
    } else if (req.body.status === 'checked_out') {
      updateData.checkedOutAt = new Date();
    }

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: 'Booking status updated successfully', booking: updatedBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available rooms for a hostel (Public - for booking)
router.get('/available-rooms/:hostelId', [
  body('checkInDate').optional().isISO8601().withMessage('Valid check-in date required'),
  body('checkOutDate').optional().isISO8601().withMessage('Valid check-out date required'),
  body('numberOfGuests').optional().isInt({ min: 1 }).withMessage('Number of guests must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { hostelId } = req.params;
    const { checkInDate, checkOutDate, numberOfGuests } = req.query;

    // Build query for available rooms
    let query = {
      hostel: hostelId,
      isAvailable: true,
      isBlocked: false
    };

    // If dates are provided, check for conflicts
    if (checkInDate && checkOutDate) {
      const conflictingBookings = await Booking.find({
        room: { $exists: true },
        $or: [
          {
            checkInDate: { $lt: new Date(checkOutDate) },
            checkOutDate: { $gt: new Date(checkInDate) }
          }
        ],
        status: { $nin: ['cancelled', 'rejected'] }
      }).select('room');

      const bookedRoomIds = conflictingBookings.map(booking => booking.room);
      query._id = { $nin: bookedRoomIds };
    }

    // If number of guests specified, filter by capacity
    if (numberOfGuests) {
      query.capacity = { $gte: parseInt(numberOfGuests) };
    }

    const availableRooms = await Room.find(query)
      .populate('hostel', 'name address')
      .sort({ price: 1, roomNumber: 1 });

    res.json({
      message: 'Available rooms retrieved successfully',
      rooms: availableRooms,
      total: availableRooms.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking (Tenant only - own booking)
router.put('/:id/cancel', [
  auth,
  roleCheck(['tenant']),
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.tenant.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (['checked_in', 'checked_out', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, {
      status: 'cancelled',
      cancellationReason: req.body.reason
    }, { new: true });

    res.json({ message: 'Booking cancelled successfully', booking: updatedBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
