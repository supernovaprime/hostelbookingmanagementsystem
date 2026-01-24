const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Create a new hostel (Manager only)
router.post('/', [
  auth,
  roleCheck(['manager']),
  body('name').notEmpty().withMessage('Hostel name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('address.street').notEmpty().withMessage('Street address is required'),
  body('address.city').notEmpty().withMessage('City is required'),
  body('address.state').notEmpty().withMessage('State is required'),
  body('address.country').notEmpty().withMessage('Country is required'),
  body('address.zipCode').notEmpty().withMessage('Zip code is required'),
  body('contactInfo.phone').notEmpty().withMessage('Phone number is required'),
  body('contactInfo.email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const hostelData = {
      ...req.body,
      manager: req.user.id
    };

    const hostel = new Hostel(hostelData);
    await hostel.save();

    res.status(201).json({ message: 'Hostel created successfully', hostel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all hostels (Public)
router.get('/', async (req, res) => {
  try {
    const hostels = await Hostel.find({ isActive: true }).populate('manager', 'name email');
    res.json(hostels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hostel by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id).populate('manager', 'name email');
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }
    res.json(hostel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update hostel (Manager only - own hostel)
router.put('/:id', [
  auth,
  roleCheck(['manager']),
  body('name').optional().notEmpty().withMessage('Hostel name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('contactInfo.email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Check if the user is the manager of this hostel
    if (hostel.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedHostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Hostel updated successfully', hostel: updatedHostel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete hostel (Super Admin or Manager - own hostel)
router.delete('/:id', [auth, roleCheck(['superadmin', 'manager'])], async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Check if the user is the manager of this hostel or a super admin
    if (req.user.role !== 'superadmin' && hostel.manager.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Hostel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hostel deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
