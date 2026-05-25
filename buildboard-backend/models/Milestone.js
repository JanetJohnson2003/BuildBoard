const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

milestoneSchema.index({ repository: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Milestone', milestoneSchema);
