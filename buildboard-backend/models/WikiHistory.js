const mongoose = require('mongoose');

const wikiHistorySchema = new mongoose.Schema(
  {
    wiki: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wiki',
      required: true,
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    title: String,
    slug: String,
    content: String,
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

wikiHistorySchema.index({ wiki: 1, createdAt: -1 });
wikiHistorySchema.index({ repository: 1, slug: 1, createdAt: -1 });

module.exports = mongoose.model('WikiHistory', wikiHistorySchema);
