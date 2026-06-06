const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'internal'],
      default: 'public',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    topics: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    readme: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: '',
    },
    languages: {
      type: Map,
      of: Number,
      default: {},
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['read', 'write', 'admin'],
          default: 'read',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    forkedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      default: null,
    },
    importedFrom: {
      provider: { type: String, default: '' },
      url: { type: String, default: '' },
      importedAt: { type: Date, default: null },
    },
    templateSource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      default: null,
    },
    forkCount: {
      type: Number,
      default: 0,
    },
    starCount: {
      type: Number,
      default: 0,
    },
    watcherCount: {
      type: Number,
      default: 0,
    },
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    openIssueCount: {
      type: Number,
      default: 0,
    },
    openPrCount: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    pinnedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    transfer: {
      requestedTo: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'transfer.requestedToModel',
        default: null,
      },
      requestedToModel: {
        type: String,
        enum: ['User', 'Organization'],
        default: 'User',
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      requestedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'rejected'],
        default: 'none',
      },
    },
    website: {
      type: String,
      default: '',
    },
    license: {
      type: String,
      default: '',
    },
    packages: [
      {
        name: String,
        version: String,
        registry: {
          type: String,
          enum: ['npm', 'docker', 'maven', 'nuget', 'generic'],
          default: 'generic',
        },
        downloads: { type: Number, default: 0 },
        publishedAt: { type: Date, default: Date.now },
      },
    ],
    subscriptions: {
      enabled: { type: Boolean, default: false },
      tiers: [
        {
          name: String,
          price: Number,
          benefits: [String]
        }
      ],
      subscribers: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          tierName: String,
          subscribedAt: { type: Date, default: Date.now }
        }
      ]
    },
    settings: {
      issuesEnabled: { type: Boolean, default: true },
      projectsEnabled: { type: Boolean, default: true },
      wikiEnabled: { type: Boolean, default: true },
      discussionsEnabled: { type: Boolean, default: true },
      actionsEnabled: { type: Boolean, default: true },
      securityEnabled: { type: Boolean, default: true },
      squashMergeAllowed: { type: Boolean, default: true },
      rebaseMergeAllowed: { type: Boolean, default: true },
      mergeCommitAllowed: { type: Boolean, default: true },
      deleteBranchOnMerge: { type: Boolean, default: false },
    },
    security: {
      codeScanningEnabled: { type: Boolean, default: true },
      secretScanningEnabled: { type: Boolean, default: true },
      dependencyAlertsEnabled: { type: Boolean, default: true },
      vulnerabilityPolicy: { type: String, default: 'standard' },
    },
  },
  { timestamps: true }
);

// Compound unique index: owner + slug must be unique
repositorySchema.index({ owner: 1, slug: 1 }, { unique: true });
repositorySchema.index(
  { name: 'text', description: 'text', topics: 'text' },
  { name: 'repository_text_search', default_language: 'none', language_override: 'searchLanguage' }
);
repositorySchema.index({ starCount: -1 });
repositorySchema.index({ updatedAt: -1 });

repositorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Repository', repositorySchema);
