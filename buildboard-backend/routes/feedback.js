const express = require('express');
const router = express.Router();
const { addFeedback, getFeedback } = require('../controllers/feedbackController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, addFeedback);
router.get('/:versionId', auth, getFeedback);

module.exports = router;