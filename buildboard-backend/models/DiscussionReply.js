const mongoose = require('mongoose');

const discussionReplySchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discussion',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    parentReply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiscussionReply',
      default: null,
    },
    reactions: {
      thumbsUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      heart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      rocket: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    isAnswer: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

discussionReplySchema.index({ discussion: 1, createdAt: 1 });

module.exports = mongoose.model('DiscussionReply', discussionReplySchema);
