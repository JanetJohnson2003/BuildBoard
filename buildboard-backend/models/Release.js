const mongoose = require('mongoose');

const releaseSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    tagName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    isPrerelease: {
      type: Boolean,
      default: false,
    },
    assets: [
      {
        name: String,
        path: String,
        size: Number,
        mimeType: String,
        downloadCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    targetBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

releaseSchema.index({ repository: 1, tagName: 1 }, { unique: true });
releaseSchema.index({ repository: 1, createdAt: -1 });

module.exports = mongoose.model('Release', releaseSchema);
