const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'VIEW_ALL_USERS',
        'VIEW_USER_DETAILS',
        'CHANGE_USER_ROLE',
        'BAN_USER',
        'UNBAN_USER',
        'DELETE_USER',
        'WARN_USER',
        'DELETE_PROJECT',
        'ARCHIVE_PROJECT',
        'RESTORE_PROJECT',
        'FLAG_FEEDBACK',
        'DELETE_FEEDBACK',
        'EXPORT_LOGS',
        'DELETE_LOG'
      ]
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    details: {
      type: Object,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);