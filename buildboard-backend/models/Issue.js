const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'review', 'testing', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    linkedPullRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PullRequest',
      },
    ],
    linkedCommits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commit',
      },
    ],
    estimate: {
      points: { type: Number, default: 0 },
      sprint: { type: String, default: '' },
    },
    bountyAmount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    reactions: {
      thumbsUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      thumbsDown: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      heart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      rocket: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

issueSchema.index({ repository: 1, number: 1 }, { unique: true });
issueSchema.index({ repository: 1, status: 1 });
issueSchema.index({ repository: 1, priority: 1, dueDate: 1 });
issueSchema.index({ author: 1, status: 1 });
issueSchema.index({ title: 'text', body: 'text' });

module.exports = mongoose.model('Issue', issueSchema);
