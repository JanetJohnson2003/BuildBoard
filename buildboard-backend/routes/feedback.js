const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

console.log('✅ Feedback routes loading...');

// ✅ GET feedback by version ID
router.get('/version/:versionId', auth, (req, res, next) => {
  console.log('📥 GET /version/:versionId route hit');
  feedbackController.getFeedbackByVersion(req, res, next);
});

// ✅ POST - Create feedback
router.post('/', auth, (req, res, next) => {
  console.log('💬 POST / route hit');
  feedbackController.createFeedback(req, res, next);
});

// ✅ GET feedback by ID
router.get('/:feedbackId', auth, (req, res, next) => {
  console.log('📖 GET /:feedbackId route hit');
  feedbackController.getFeedbackById(req, res, next);
});

// ✅ PUT - Update feedback
router.put('/:feedbackId', auth, (req, res, next) => {
  console.log('✏️ PUT /:feedbackId route hit');
  feedbackController.updateFeedback(req, res, next);
});

// ✅ DELETE - Delete feedback
router.delete('/:feedbackId', auth, (req, res, next) => {
  console.log('🗑️ DELETE /:feedbackId route hit');
  feedbackController.deleteFeedback(req, res, next);
});

console.log('✅ Feedback routes loaded successfully');

module.exports = router;