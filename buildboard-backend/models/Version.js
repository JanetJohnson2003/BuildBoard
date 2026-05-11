const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  versionNumber: {
    type: String,
    required: true
  },
  releaseNotes: {
    type: String,
    default: ''
  },
  file: {
    filename: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Version', VersionSchema);