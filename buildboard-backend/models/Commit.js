const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sha: {
      type: String,
      required: true,
      unique: true,
    },
    filesChanged: [
      {
        filename: { type: String, required: true },
        status: {
          type: String,
          enum: ['added', 'modified', 'deleted'],
          required: true,
        },
        additions: { type: Number, default: 0 },
        deletions: { type: Number, default: 0 },
        patch: { type: String, default: '' },
      },
    ],
    parentCommit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commit',
      default: null,
    },
    stats: {
      totalAdditions: { type: Number, default: 0 },
      totalDeletions: { type: Number, default: 0 },
      filesChangedCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

commitSchema.index({ repository: 1, createdAt: -1 });
commitSchema.index({ branch: 1, createdAt: -1 });
commitSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Commit', commitSchema);
