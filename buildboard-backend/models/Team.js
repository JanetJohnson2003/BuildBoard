const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
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
    },
    privacy: {
      type: String,
      enum: ['visible', 'secret'],
      default: 'visible',
    },
    parentTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['maintainer', 'member'],
          default: 'member',
        },
      },
    ],
    repositories: [
      {
        repository: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Repository',
        },
        permission: {
          type: String,
          enum: ['read', 'triage', 'write', 'maintain', 'admin'],
          default: 'read',
        },
      },
    ],
  },
  { timestamps: true }
);

teamSchema.index({ organization: 1, slug: 1 }, { unique: true });
teamSchema.index({ organization: 1, name: 1 });

module.exports = mongoose.model('Team', teamSchema);
