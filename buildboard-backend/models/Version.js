const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    projectId: {
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true  // ✅ MUST BE REQUIRED
    },
    file: {
      fileName: String,
      filePath: String,
      fileSize: Number,
      mimeType: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Version', versionSchema);