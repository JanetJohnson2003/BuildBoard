const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        // Repository actions
        'REPO_CREATED',
        'REPO_DELETED',
        'REPO_ARCHIVED',
        'REPO_UNARCHIVED',
        'REPO_FORKED',
        'REPO_STARRED',
        'REPO_UNSTARRED',
        'REPO_WATCHED',
        'REPO_UNWATCHED',
        'REPO_PINNED',
        'REPO_UNPINNED',
        'REPO_TRANSFERRED',
        // Branch actions
        'BRANCH_CREATED',
        'BRANCH_DELETED',
        'BRANCH_PROTECTED',
        'BRANCH_UNPROTECTED',
        // Commit actions
        'COMMIT_PUSHED',
        'COMMIT_REVERTED',
        // File actions
        'FILE_CREATED',
        'FILE_UPDATED',
        'FILE_DELETED',
        'FILE_MOVED',
        'FILES_UPLOADED',
        // Issue actions
        'ISSUE_OPENED',
        'ISSUE_CLOSED',
        'ISSUE_REOPENED',
        'ISSUE_COMMENTED',
        // PR actions
        'PR_OPENED',
        'PR_CLOSED',
        'PR_MERGED',
        'PR_REVIEWED',
        'PR_COMMENTED',
        // Discussion actions
        'DISCUSSION_CREATED',
        'DISCUSSION_COMMENTED',
        'DISCUSSION_ANSWERED',
        // Release actions
        'RELEASE_PUBLISHED',
        'TAG_CREATED',
        'TAG_DELETED',
        // Wiki actions
        'WIKI_UPDATED',
        // Workflow actions
        'WORKFLOW_CREATED',
        'WORKFLOW_RUN_STARTED',
        'WORKFLOW_RUN_COMPLETED',
        // Organization actions
        'ORG_CREATED',
        'TEAM_CREATED',
        // User actions
        'USER_FOLLOWED',
        'USER_UNFOLLOWED',
        // Admin actions
        'ADMIN_USER_BANNED',
        'ADMIN_USER_UNBANNED',
        'ADMIN_USER_ROLE_CHANGED',
        'ADMIN_USER_DELETED',
        'ADMIN_REPO_DELETED',
        'ADMIN_EXPORT_LOGS',
        'ADMIN_LOGIN_LOCKED',
        'ADMIN_LOGIN_UNLOCKED',
        'ADMIN_FORCE_LOGOUT',
        'ADMIN_PASSWORD_RESET',
        'ADMIN_SESSION_PURGE_ALL',
        'GOD_USER_MIRROR',
        'GOD_PLATFORM_LOCKDOWN',
        'GOD_MASS_ROLE_ASSIGN',
        'GOD_REPO_ANNIHILATE',
        'GOD_BROADCAST',
        'GOD_ASCENSION',
        'GOD_EMERGENCY_LOCKDOWN',
        'GOD_TIMELINE_PURGE',
        'GOD_USER_GENESIS',
        'GOD_IDENTITY_OVERRIDE',
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
    },
    referenceType: {
      type: String,
      enum: ['repository', 'issue', 'pullrequest', 'commit', 'discussion', 'release', 'user', 'branch', 'file', 'tag', 'wiki', 'workflow', 'organization', 'team'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ repository: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
