const mongoose = require('mongoose');

const starSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
  },
  { timestamps: true }
);

starSchema.index({ user: 1, repository: 1 }, { unique: true });
starSchema.index({ repository: 1 });
starSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Star', starSchema);
