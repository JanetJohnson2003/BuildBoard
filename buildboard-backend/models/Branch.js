const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
    protectionRules: {
      requirePullRequest: { type: Boolean, default: false },
      requiredApprovals: { type: Number, default: 1 },
      requireStatusChecks: { type: Boolean, default: false },
      requiredChecks: [{ type: String, trim: true }],
      restrictPushes: { type: Boolean, default: false },
      allowedPushers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      allowForcePushes: { type: Boolean, default: false },
      allowDeletions: { type: Boolean, default: false },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastCommit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commit',
      default: null,
    },
    sourceBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
  },
  { timestamps: true }
);

branchSchema.index({ repository: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);
