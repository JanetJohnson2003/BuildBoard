const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 39,
      match: [/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){2,38}$/, 'Invalid username format'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['developer', 'reviewer', 'project_manager', 'admin'],
      default: 'developer',
    },
    avatar: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 256,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    socialLinks: {
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    experience: [
      {
        title: String,
        organization: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],
    location: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    resume: {
      type: String,
      default: null,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    refreshToken: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, default: null },
      recoveryCodes: [{ type: String }],
    },
    loginHistory: [
      {
        ip: String,
        userAgent: String,
        location: String,
        success: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    devices: [
      {
        name: String,
        userAgent: String,
        ip: String,
        lastSeenAt: { type: Date, default: Date.now },
        trusted: { type: Boolean, default: false },
      },
    ],
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    warnings: [
      {
        reason: String,
        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        issuedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pinnedRepos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
      },
    ],
    contributionStats: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      totalContributions: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ name: 'text', username: 'text', bio: 'text' });

// Virtual for follower/following counts
userSchema.virtual('followerCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
