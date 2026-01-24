const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Create a new room (Manager only - own hostel)
router.post('/', [
  auth,
  roleCheck(['manager']),
  body('hostel').notEmpty().withMessage('Hostel ID is required'),
  body('roomNumber').notEmpty().withMessage('Room number is required'),
  body('type').isIn(['single', 'double', 'triple', 'dormitory']).withMessage('Invalid room type'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price.amount').isFloat({ min: 0 }).withMessage('Price must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if hostel exists and user is the manager
    const hostel = await Hostel.findById(req.body.hostel);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }
    if (hostel.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const room = new Room(req.body);
    await room.save();

    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rooms by hostel (Public)
router.get('/hostel/:hostelId', async (req, res) => {
  try {
    const rooms = await Room.find({ hostel: req.params.hostelId, isAvailable: true });
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostel');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update room (Manager only - own hostel)
router.put('/:id', [
  auth,
  roleCheck(['manager']),
  body('roomNumber').optional().notEmpty().withMessage('Room number cannot be empty'),
  body('type').optional().isIn(['single', 'double', 'triple', 'dormitory']).withMessage('Invalid room type'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('price.amount').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const room = await Room.findById(req.params.id).populate('hostel');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the manager of the hostel
    if (room.hostel.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete room (Manager only - own hostel)
router.delete('/:id', [auth, roleCheck(['manager'])], async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostel');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is the manager of the hostel
    if (room.hostel.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
