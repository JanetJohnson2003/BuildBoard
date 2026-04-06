const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  version: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version'
  },
  comment: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);