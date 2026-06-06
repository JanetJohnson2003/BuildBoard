const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    avatar: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    owners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'maintainer', 'developer', 'reviewer'],
          default: 'developer',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    securityPolicy: {
      require2FA: { type: Boolean, default: false },
      defaultRepositoryVisibility: {
        type: String,
        enum: ['public', 'private', 'internal'],
        default: 'private',
      },
      allowedIpRanges: [{ type: String }],
    },
    featureFlags: {
      actions: { type: Boolean, default: true },
      discussions: { type: Boolean, default: true },
      packages: { type: Boolean, default: true },
      aiAssistant: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

organizationSchema.index({ name: 'text', slug: 'text', description: 'text' });

module.exports = mongoose.model('Organization', organizationSchema);
