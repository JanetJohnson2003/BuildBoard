const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
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
    path: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['file', 'directory'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'text/plain',
    },
    encoding: {
      type: String,
      enum: ['utf-8', 'base64'],
      default: 'utf-8',
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastCommit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commit',
    },
  },
  { timestamps: true }
);

fileSchema.index({ repository: 1, branch: 1, path: 1 }, { unique: true });
fileSchema.index({ repository: 1, branch: 1, type: 1 });

module.exports = mongoose.model('File', fileSchema);
