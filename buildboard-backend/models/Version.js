const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  versionNumber: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  file: {
    type: String
  },
  file: {
  type: String
}
}, { timestamps: true });
module.exports = mongoose.model('Version', VersionSchema);