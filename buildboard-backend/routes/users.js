const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getAllReviewers, getAllUsers } = require('../controllers/userController');

// Get all reviewers ONLY (for sharing projects)
router.get('/', auth, getAllReviewers);

// Get all users (if needed for other purposes)
router.get('/all', auth, getAllUsers);

module.exports = router;