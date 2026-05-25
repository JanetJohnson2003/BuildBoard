const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Polymorphic association
    commentableType: {
      type: String,
      enum: ['issue', 'pullrequest', 'discussion', 'review'],
      required: true,
    },
    commentableId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    reactions: {
      thumbsUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      thumbsDown: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      heart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      laugh: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      rocket: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      eyes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    // For inline code review comments
    filePath: {
      type: String,
      default: null,
    },
    lineNumber: {
      type: Number,
      default: null,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

commentSchema.index({ commentableType: 1, commentableId: 1, createdAt: 1 });
commentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', commentSchema);
