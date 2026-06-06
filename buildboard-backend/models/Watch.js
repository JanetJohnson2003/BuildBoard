const mongoose = require('mongoose');

const watchSchema = new mongoose.Schema(
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
    level: {
      type: String,
      enum: ['participating', 'all', 'ignore'],
      default: 'all',
    },
  },
  { timestamps: true }
);

watchSchema.index({ user: 1, repository: 1 }, { unique: true });

module.exports = mongoose.model('Watch', watchSchema);
