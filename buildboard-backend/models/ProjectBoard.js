const mongoose = require('mongoose');

const projectBoardSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    columns: [
      {
        name: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
          default: 0,
        },
        color: {
          type: String,
          default: '#e2e8f0',
        },
        items: [
          {
            type: {
              type: String,
              enum: ['issue', 'pullrequest', 'note'],
              required: true,
            },
            referenceId: {
              type: mongoose.Schema.Types.ObjectId,
              default: null,
            },
            note: {
              type: String,
              default: '',
            },
            order: {
              type: Number,
              default: 0,
            },
            addedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

projectBoardSchema.index({ repository: 1 });

module.exports = mongoose.model('ProjectBoard', projectBoardSchema);
