const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get user's maintenance requests (tenant only)
router.get('/', authenticateToken, requireRole(['tenant']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { tenant: req.user._id };
    if (status) query.status = status;

    const requests = await MaintenanceRequest.find(query)
      .populate('booking', 'room checkInDate checkOutDate')
      .populate('hostel', 'name address')
      .populate('assignedTo', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await MaintenanceRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Maintenance requests fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create maintenance request (tenant only)
router.post('/', authenticateToken, requireRole(['tenant']), [
  body('bookingId').isMongoId().withMessage('Valid booking ID required'),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('category').isIn(['electrical', 'plumbing', 'cleaning', 'furniture', 'appliance', 'structural', 'other']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, title, description, priority, category, images } = req.body;

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate('hostel')
      .populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create maintenance request for this booking' });
    }

    // Check if booking is active
    if (!['confirmed', 'checked_in'].includes(booking.status)) {
      return res.status(400).json({ message: 'Maintenance requests can only be created for active bookings' });
    }

    const maintenanceRequest = new MaintenanceRequest({
      booking: bookingId,
      tenant: req.user._id,
      hostel: booking.hostel._id,
      room: booking.room._id,
      title,
      description,
      priority,
      category,
      images: images || [],
      status: 'pending'
    });

    await maintenanceRequest.save();

    // Create notification for hostel manager
    const notification = new Notification({
      recipient: booking.hostel.manager,
      type: 'maintenance_request',
      title: 'New Maintenance Request',
      message: `A new maintenance request has been submitted: ${title}`,
      data: {
        requestId: maintenanceRequest._id,
        bookingId: bookingId,
        priority: priority,
        category: category
      }
    });

    await notification.save();

    res.status(201).json({
      message: 'Maintenance request created successfully',
      request: maintenanceRequest
    });
  } catch (error) {
    console.error('Maintenance request creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update maintenance request status (manager only)
router.put('/:id/status', authenticateToken, requireRole(['manager', 'superadmin']), [
  body('status').isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('hostel')
      .populate('tenant', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    // Check if user is the manager of the hostel or superadmin
    if (req.user.role !== 'superadmin' && request.hostel.manager.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this maintenance request' });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'in_progress') {
      updateData.assignedTo = req.user._id;
      updateData.startedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo', 'name email');

    // Create notification for tenant
    const notification = new Notification({
      recipient: request.tenant._id,
      type: 'maintenance_update',
      title: 'Maintenance Request Update',
      message: `Your maintenance request "${request.title}" has been ${status}`,
      data: {
        requestId: request._id,
        status: status,
        notes: notes
      }
    });

    await notification.save();

    res.json({
      message: 'Maintenance request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Maintenance request update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get maintenance requests for managed hostels (manager only)
router.get('/managed/requests', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, hostelId } = req.query;

    // Get hostels managed by the user
    const Hostel = require('../models/Hostel');
    const managedHostels = await Hostel.find({ manager: req.user._id }).select('_id');
    const hostelIds = managedHostels.map(h => h._id);

    const query = { hostel: { $in: hostelIds } };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (hostelId) query.hostel = hostelId;

    const requests = await MaintenanceRequest.find(query)
      .populate('tenant', 'name email phone')
      .populate('booking', 'room checkInDate checkOutDate')
      .populate('hostel', 'name')
      .populate('assignedTo', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await MaintenanceRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Managed maintenance requests fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get maintenance request statistics (manager only)
router.get('/managed/stats', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    // Get hostels managed by the user
    const Hostel = require('../models/Hostel');
    const managedHostels = await Hostel.find({ manager: req.user._id }).select('_id');
    const hostelIds = managedHostels.map(h => h._id);

    const stats = await MaintenanceRequest.aggregate([
      { $match: { hostel: { $in: hostelIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await MaintenanceRequest.aggregate([
      { $match: { hostel: { $in: hostelIds } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statusStats: stats,
      priorityStats: priorityStats
    });
  } catch (error) {
    console.error('Maintenance stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
