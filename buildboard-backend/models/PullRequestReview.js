const mongoose = require('mongoose');

const pullRequestReviewSchema = new mongoose.Schema(
  {
    pullRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PullRequest',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['commented', 'approved', 'changes_requested'],
      required: true,
    },
    body: {
      type: String,
      default: '',
    },
    inlineComments: [
      {
        filePath: String,
        lineNumber: Number,
        body: String,
        suggestedChange: String,
        threadId: String,
        resolved: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

pullRequestReviewSchema.index({ pullRequest: 1, createdAt: -1 });
pullRequestReviewSchema.index({ reviewer: 1, createdAt: -1 });

module.exports = mongoose.model('PullRequestReview', pullRequestReviewSchema);
