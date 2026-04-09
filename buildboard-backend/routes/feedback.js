const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createFeedback,
  getFeedbackByVersion,
  getAllFeedback,
  addReply,
  deleteReply,
  deleteFeedback
} = require('../controllers/feedbackController');

// Create feedback
router.post('/', auth, createFeedback);

// Get feedback by version
router.get('/:versionId', auth, getFeedbackByVersion);

// Get all feedback
router.get('/', auth, getAllFeedback);

// Add reply to feedback
router.post('/:feedbackId/reply', auth, addReply);

// Delete reply
router.delete('/:feedbackId/reply/:replyId', auth, deleteReply);

// Delete feedback
router.delete('/:feedbackId', auth, deleteFeedback);

module.exports = router;