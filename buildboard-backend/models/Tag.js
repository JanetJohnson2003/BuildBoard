const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
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
    commit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Commit',
      default: null,
    },
    sha: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    tagger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    annotated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

tagSchema.index({ repository: 1, name: 1 }, { unique: true });
tagSchema.index({ repository: 1, createdAt: -1 });

module.exports = mongoose.model('Tag', tagSchema);
