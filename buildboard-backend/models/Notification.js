const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'repo_starred',
        'repo_forked',
        'repo_shared',
        'issue_created',
        'issue_assigned',
        'issue_closed',
        'issue_comment',
        'pr_created',
        'pr_review_requested',
        'pr_approved',
        'pr_changes_requested',
        'pr_merged',
        'pr_closed',
        'pr_comment',
        'discussion_created',
        'discussion_comment',
        'release_published',
        'new_follower',
        'mention',
        'commit_comment',
        'collaborator_added',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
    },
    // Generic reference for linking to the related entity
    referenceType: {
      type: String,
      enum: ['issue', 'pullrequest', 'discussion', 'release', 'commit', 'repository', 'user'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);