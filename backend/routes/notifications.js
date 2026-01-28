const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;

    const query = { recipient: req.user._id };
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (type) query.type = type;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Notification deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notification (internal use - called by other routes)
router.post('/create', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const { recipient, type, title, message, data } = req.body;

    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      data: data || {},
      isRead: false
    });

    await notification.save();

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Notification creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification statistics (admin only)
router.get('/admin/stats', authenticateToken, requireRole(['superadmin']), async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          readCount: {
            $sum: { $cond: ['$isRead', 1, 0] }
          }
        }
      },
      {
        $project: {
          type: '$_id',
          total: '$count',
          read: '$readCount',
          unread: { $subtract: ['$count', '$readCount'] },
          readRate: {
            $multiply: [
              { $divide: ['$readCount', '$count'] },
              100
            ]
          }
        }
      }
    ]);

    res.json({ stats });
  } catch (error) {
    console.error('Notification stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
