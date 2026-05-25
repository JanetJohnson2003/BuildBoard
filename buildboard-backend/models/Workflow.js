const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
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
    path: {
      type: String,
      default: '.buildboard/workflows/pipeline.yml',
    },
    yaml: {
      type: String,
      required: true,
    },
    triggers: [
      {
        type: String,
        enum: ['push', 'pull_request', 'schedule', 'manual', 'release'],
      },
    ],
    jobs: [
      {
        name: String,
        runsOn: { type: String, default: 'ubuntu-latest' },
        steps: [String],
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

workflowSchema.index({ repository: 1, name: 1 }, { unique: true });
workflowSchema.index({ repository: 1, enabled: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);
