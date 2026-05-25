const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.get('/dashboard', auth, analyticsController.getDashboardAnalytics);
router.get('/admin', auth, requireRole('admin'), analyticsController.getAdminAnalytics);
router.get('/repo/:owner/:repo', auth, analyticsController.getRepoAnalytics);

module.exports = router;