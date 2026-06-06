const mongoose = require('mongoose');

const wikiSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    content: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    order: {
      type: Number,
      default: 0,
    },
    versions: [
      {
        content: String,
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
        message: String,
      },
    ],
  },
  { timestamps: true }
);

wikiSchema.index({ repository: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Wiki', wikiSchema);
