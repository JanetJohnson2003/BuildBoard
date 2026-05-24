const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'reviewer', 'admin'],
      default: 'user'
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    warnings: [
      {
        reason: String,
        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        issuedAt: Date
      }
    ],
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);