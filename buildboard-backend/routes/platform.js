const router = require('express').Router();
const platformController = require('../controllers/platformController');
const auth = require('../middleware/authMiddleware');

router.get('/dashboard', auth, platformController.getHomeDashboard);
router.get('/search', auth, platformController.globalSearch);
router.get('/organizations', auth, platformController.getOrganizations);
router.post('/organizations', auth, platformController.createOrganization);
router.get('/organizations/:org', auth, platformController.getOrganization);
router.post('/organizations/:org/teams', auth, platformController.createTeam);

module.exports = router;
