const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Get unread count - MUST BE BEFORE /:notificationId
router.get('/unread-count', auth, getUnreadCount);

// Get all notifications for user
router.get('/', auth, getUserNotifications);

// Mark all as read - MUST BE BEFORE /:notificationId
router.put('/mark-all-read', auth, markAllAsRead);

// Mark single notification as read
router.put('/:notificationId/read', auth, markAsRead);

// Delete notification
router.delete('/:notificationId', auth, deleteNotification);

// Create notification (internal)
router.post('/', auth, createNotification);

module.exports = router;