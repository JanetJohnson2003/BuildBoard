const mongoose = require('mongoose');

const workflowRunSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    runNumber: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      default: 'main',
    },
    commitSha: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed'],
      default: 'queued',
    },
    conclusion: {
      type: String,
      enum: ['success', 'failure', 'cancelled', 'skipped', 'neutral', null],
      default: null,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
        message: String,
      },
    ],
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

workflowRunSchema.index({ workflow: 1, runNumber: 1 }, { unique: true });
workflowRunSchema.index({ repository: 1, createdAt: -1 });

module.exports = mongoose.model('WorkflowRun', workflowRunSchema);
