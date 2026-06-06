const mongoose = require('mongoose');

const repositoryMemberSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
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
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['invited', 'active', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

repositoryMemberSchema.index({ repository: 1, user: 1 }, { unique: true });
repositoryMemberSchema.index({ user: 1, role: 1 });

module.exports = mongoose.model('RepositoryMember', repositoryMemberSchema);
