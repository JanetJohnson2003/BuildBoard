const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getDashboardAnalytics,
  getUserStats
} = require('../controllers/analyticsController');

// Get dashboard analytics
router.get('/dashboard', auth, getDashboardAnalytics);

// Get user stats
router.get('/user-stats', auth, getUserStats);

module.exports = router;