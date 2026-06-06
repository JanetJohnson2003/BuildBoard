const mongoose = require('mongoose');

const pullRequestSchema = new mongoose.Schema(
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
    sourceBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    targetBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'merged'],
      default: 'open',
    },
    mergeStrategy: {
      type: String,
      enum: ['merge', 'squash', 'rebase'],
      default: 'merge',
    },
    reviewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'commented', 'approved', 'changes_requested'],
          default: 'pending',
        },
        reviewedAt: Date,
        comment: String,
      },
    ],
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mergedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    mergedAt: {
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
    commits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commit',
      },
    ],
    linkedIssues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue',
      },
    ],
    checks: [
      {
        name: String,
        status: {
          type: String,
          enum: ['queued', 'in_progress', 'success', 'failure', 'cancelled'],
          default: 'queued',
        },
        detailsUrl: String,
        completedAt: Date,
      },
    ],
    reviewDecision: {
      type: String,
      enum: ['review_required', 'approved', 'changes_requested', 'commented'],
      default: 'review_required',
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    isDraft: {
      type: Boolean,
      default: false,
    },
    filesChanged: {
      type: Number,
      default: 0,
    },
    additions: {
      type: Number,
      default: 0,
    },
    deletions: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

pullRequestSchema.index({ repository: 1, number: 1 }, { unique: true });
pullRequestSchema.index({ repository: 1, status: 1 });
pullRequestSchema.index({ author: 1, status: 1 });
pullRequestSchema.index({ repository: 1, reviewDecision: 1 });
pullRequestSchema.index({ title: 'text', body: 'text' });

module.exports = mongoose.model('PullRequest', pullRequestSchema);
