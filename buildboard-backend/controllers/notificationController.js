const Notification = require('../models/Notification');
const User = require('../models/User');
const Version = require('../models/Version');
const Project = require('../models/Project');

// CREATE NOTIFICATION
exports.createNotification = async (req, res) => {
  try {
    const { recipientId, senderId, type, title, message, projectId, versionId } = req.body;

    if (!recipientId || !senderId || !type || !title || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      project: projectId,
      version: versionId
    });

    await notification.populate('sender', 'name email');
    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET USER NOTIFICATIONS
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('sender', 'name email')
      .populate('project', 'title')
      .populate('version', 'versionNumber')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET UNREAD NOTIFICATIONS COUNT
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.userId,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: error.message });
  }
};

// MARK NOTIFICATION AS READ
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    ).populate('sender', 'name email');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// HELPER: CREATE NOTIFICATION INTERNALLY (called from other controllers)
exports.createNotificationInternal = async (recipientId, senderId, type, title, message, projectId, versionId) => {
  try {
    // Don't send notification to self
    if (recipientId.toString() === senderId.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      project: projectId,
      version: versionId,
      read: false
    });

    await notification.populate('sender', 'name email');
    console.log('✅ Notification created:', {
      recipient: recipientId,
      type,
      title
    });

    return notification;
  } catch (error) {
    console.error('⚠️ Error creating internal notification:', error.message);
    return null;
  }
};