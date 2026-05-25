const mongoose = require('mongoose');

const securityAlertSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    type: {
      type: String,
      enum: ['dependency', 'secret', 'code_scanning', 'policy'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'dismissed', 'fixed'],
      default: 'open',
    },
    dismissedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dismissedAt: Date,
  },
  { timestamps: true }
);

securityAlertSchema.index({ repository: 1, status: 1, severity: 1 });

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
