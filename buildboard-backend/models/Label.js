const mongoose = require('mongoose');

const labelSchema = new mongoose.Schema(
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
    color: {
      type: String,
      required: true,
      default: '#e4e669',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

labelSchema.index({ repository: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Label', labelSchema);
