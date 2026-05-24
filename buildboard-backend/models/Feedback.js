const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Version',
      required: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending'
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);