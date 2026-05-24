const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'feedback_received',
      'version_uploaded',
      'reply_to_feedback',
      'project_shared' // ✅ ADD THIS
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  version: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);